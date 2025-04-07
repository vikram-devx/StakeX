import { 
  users, type User, type InsertUser, 
  markets, type Market, type InsertMarket, 
  gameTypes, type GameType, type InsertGameType, 
  bets, type Bet, type InsertBet, 
  transactions, type Transaction, type InsertTransaction 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from "pg";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser & { role?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password,
        role: userData.role || "user"
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Market methods
  async createMarket(marketData: InsertMarket): Promise<Market> {
    const [market] = await db
      .insert(markets)
      .values({
        name: marketData.name,
        description: marketData.description,
        bannerImage: marketData.bannerImage,
        status: "open", // Changed from "pending" to "open" so markets appear in active list immediately
        openingTime: marketData.openingTime,
        closingTime: marketData.closingTime,
        resultTime: marketData.resultTime,
        createdBy: marketData.createdBy,
        gameTypes: marketData.gameTypes
      })
      .returning();
    return market;
  }

  async getMarket(id: number): Promise<Market | undefined> {
    const [market] = await db.select().from(markets).where(eq(markets.id, id));
    return market || undefined;
  }

  async getActiveMarkets(): Promise<Market[]> {
    return await db
      .select()
      .from(markets)
      .where(inArray(markets.status, ["open", "closing_soon"]));
  }

  async getAllMarkets(): Promise<Market[]> {
    return await db.select().from(markets);
  }

  async updateMarketStatus(id: number, status: string): Promise<Market> {
    const [market] = await db
      .update(markets)
      .set({ status })
      .where(eq(markets.id, id))
      .returning();
    
    if (!market) {
      throw new Error("Market not found");
    }
    
    return market;
  }

  async declareResult(id: number, result: string, declaredById: number): Promise<Market> {
    const [market] = await db
      .update(markets)
      .set({ 
        status: "resulted",
        result,
        resultDeclaredAt: new Date(),
        resultDeclaredBy: declaredById
      })
      .where(eq(markets.id, id))
      .returning();
    
    if (!market) {
      throw new Error("Market not found");
    }
    
    // Process winning bets
    await this.processWinningBets(id, result);
    
    return market;
  }

  async getResults(): Promise<Market[]> {
    return await db
      .select()
      .from(markets)
      .where(eq(markets.status, "resulted"));
  }

  // Game type methods
  async createGameType(gameTypeData: InsertGameType): Promise<GameType> {
    const [gameType] = await db
      .insert(gameTypes)
      .values({
        name: gameTypeData.name,
        description: gameTypeData.description,
        payoutMultiplier: gameTypeData.payoutMultiplier,
        gameCategory: gameTypeData.gameCategory,
        team1: gameTypeData.team1 || null,
        team2: gameTypeData.team2 || null,
        teamLogoUrl1: gameTypeData.teamLogoUrl1 || null,
        teamLogoUrl2: gameTypeData.teamLogoUrl2 || null
      })
      .returning();
    return gameType;
  }

  async getGameType(id: number): Promise<GameType | undefined> {
    const [gameType] = await db.select().from(gameTypes).where(eq(gameTypes.id, id));
    return gameType || undefined;
  }

  async getAllGameTypes(): Promise<GameType[]> {
    return await db.select().from(gameTypes);
  }

  async getMarketGameTypes(marketId: number): Promise<GameType[]> {
    const market = await this.getMarket(marketId);
    if (!market) {
      throw new Error("Market not found");
    }
    
    const gameTypeIds = market.gameTypes as number[];
    return await db
      .select()
      .from(gameTypes)
      .where(inArray(gameTypes.id, gameTypeIds));
  }

  // Bet methods
  async placeBet(betData: InsertBet): Promise<Bet> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Deduct bet amount from user balance
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, betData.userId));
      
      if (!user) {
        throw new Error("User not found");
      }
      
      const newBalance = Number(user.balance) - Number(betData.betAmount);
      if (newBalance < 0) {
        throw new Error("Insufficient balance");
      }
      
      // Update user balance
      await tx
        .update(users)
        .set({ balance: newBalance.toString() })
        .where(eq(users.id, betData.userId));
      
      // Create bet
      const [bet] = await tx
        .insert(bets)
        .values({
          userId: betData.userId,
          marketId: betData.marketId,
          gameTypeId: betData.gameTypeId,
          betAmount: betData.betAmount,
          selection: betData.selection,
          status: "pending",
          potentialWin: betData.potentialWin
        })
        .returning();
      
      // Record transaction
      await tx
        .insert(transactions)
        .values({
          userId: betData.userId,
          amount: betData.betAmount,
          type: "bet",
          status: "completed",
          description: `Bet placed on ${betData.marketId}:${betData.gameTypeId} - ${betData.selection}`,
          betId: bet.id
        });
      
      return bet;
    });
  }

  async getUserBets(userId: number): Promise<any[]> {
    const userBets = await db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.placedAt));
    
    // Enrich bets with market and game type details
    const enrichedBets = await Promise.all(userBets.map(async (bet) => {
      const market = await this.getMarket(bet.marketId);
      const gameType = await this.getGameType(bet.gameTypeId);
      return {
        ...bet,
        market,
        gameType,
      };
    }));
    
    return enrichedBets;
  }

  async getAllBets(): Promise<Bet[]> {
    return await db.select().from(bets);
  }

  async processWinningBets(marketId: number, result: string): Promise<void> {
    // Get all pending bets for this market
    const marketBets = await db
      .select()
      .from(bets)
      .where(
        and(
          eq(bets.marketId, marketId),
          eq(bets.status, "pending")
        )
      );
    
    for (const bet of marketBets) {
      const gameType = await this.getGameType(bet.gameTypeId);
      if (!gameType) continue;
      
      let isWinner = false;
      
      // Check if bet is winner based on game type
      switch (gameType.gameCategory) {
        case "cointoss":
          // Simple match for heads/tails
          isWinner = bet.selection.toLowerCase() === result.toLowerCase();
          break;
          
        case "sattamatka":
          switch (gameType.name) {
            case "Jodi":
              // Exact match for two-digit number
              isWinner = bet.selection === result;
              break;
              
            case "Hurf":
              // Single digit appears in result
              isWinner = result.includes(bet.selection);
              break;
              
            case "Cross":
              // Both digits appear in result in any order
              isWinner = bet.selection.split('').every(digit => result.includes(digit));
              break;
              
            case "Odd-Even":
              // Check if result is odd or even
              const resultNum = parseInt(result);
              const isOdd = resultNum % 2 !== 0;
              isWinner = (bet.selection === "odd" && isOdd) || (bet.selection === "even" && !isOdd);
              break;
          }
          break;
          
        case "teamMatch":
          // For team matches, the result is either "team1" or "team2"
          isWinner = bet.selection === result;
          break;
      }
      
      // Update bet status
      await db
        .update(bets)
        .set({ 
          status: isWinner ? "won" : "lost",
          winAmount: isWinner ? bet.potentialWin : "0"
        })
        .where(eq(bets.id, bet.id));
      
      // If winner, add winnings to user balance
      if (isWinner) {
        const user = await this.getUser(bet.userId);
        if (!user) continue;
        
        const newBalance = Number(user.balance) + Number(bet.potentialWin);
        await this.updateUserBalance(bet.userId, newBalance);
        
        // Record transaction
        await this.createTransaction({
          userId: bet.userId,
          amount: bet.potentialWin,
          type: "win",
          status: "completed",
          description: `Won bet on ${marketId}:${bet.gameTypeId} - ${bet.selection}`,
          betId: bet.id,
        });
      }
    }
  }

  // Transaction methods
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: transactionData.userId,
        amount: transactionData.amount,
        type: transactionData.type,
        status: transactionData.status,
        description: transactionData.description,
        betId: transactionData.betId || null
      })
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }
}
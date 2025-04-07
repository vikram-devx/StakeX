import { users, type User, type InsertUser, markets, type Market, type InsertMarket, gameTypes, type GameType, type InsertGameType, bets, type Bet, type InsertBet, transactions, type Transaction, type InsertTransaction } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the storage interface with all required methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string }): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Market methods
  createMarket(market: InsertMarket): Promise<Market>;
  getMarket(id: number): Promise<Market | undefined>;
  getActiveMarkets(): Promise<Market[]>;
  getAllMarkets(): Promise<Market[]>;
  updateMarketStatus(id: number, status: string): Promise<Market>;
  declareResult(id: number, result: string, declaredById: number): Promise<Market>;
  getResults(): Promise<Market[]>;

  // Game type methods
  createGameType(gameType: InsertGameType): Promise<GameType>;
  getGameType(id: number): Promise<GameType | undefined>;
  getAllGameTypes(): Promise<GameType[]>;
  getMarketGameTypes(marketId: number): Promise<GameType[]>;

  // Bet methods
  placeBet(bet: InsertBet): Promise<Bet>;
  getUserBets(userId: number): Promise<any[]>;
  getAllBets(): Promise<Bet[]>;
  processWinningBets(marketId: number, result: string): Promise<void>;

  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private markets: Map<number, Market>;
  private gameTypes: Map<number, GameType>;
  private bets: Map<number, Bet>;
  private transactions: Map<number, Transaction>;
  private userIdCounter: number;
  private marketIdCounter: number;
  private gameTypeIdCounter: number;
  private betIdCounter: number;
  private transactionIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.markets = new Map();
    this.gameTypes = new Map();
    this.bets = new Map();
    this.transactions = new Map();
    this.userIdCounter = 1;
    this.marketIdCounter = 1;
    this.gameTypeIdCounter = 1;
    this.betIdCounter = 1;
    this.transactionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData: InsertUser & { role?: string }): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = {
      id,
      username: userData.username,
      password: userData.password,
      balance: "1000", // Default starting balance
      role: userData.role || "user",
    };
    this.users.set(id, user);
    return { ...user };
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      balance: newBalance.toString(),
    };
    this.users.set(userId, updatedUser);
    return { ...updatedUser };
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Market methods
  async createMarket(marketData: InsertMarket): Promise<Market> {
    const id = this.marketIdCounter++;
    const market: Market = {
      id,
      name: marketData.name,
      status: "pending",
      openingTime: marketData.openingTime,
      closingTime: marketData.closingTime,
      createdBy: marketData.createdBy,
      gameTypes: marketData.gameTypes,
      result: null,
      resultDeclaredAt: null,
      resultDeclaredBy: null,
    };
    this.markets.set(id, market);
    return { ...market };
  }

  async getMarket(id: number): Promise<Market | undefined> {
    return this.markets.get(id);
  }

  async getActiveMarkets(): Promise<Market[]> {
    return Array.from(this.markets.values()).filter(
      (market) => market.status === "open" || market.status === "closing_soon"
    );
  }

  async getAllMarkets(): Promise<Market[]> {
    return Array.from(this.markets.values());
  }

  async updateMarketStatus(id: number, status: string): Promise<Market> {
    const market = await this.getMarket(id);
    if (!market) {
      throw new Error("Market not found");
    }
    
    const updatedMarket = {
      ...market,
      status,
    };
    this.markets.set(id, updatedMarket);
    return { ...updatedMarket };
  }

  async declareResult(id: number, result: string, declaredById: number): Promise<Market> {
    const market = await this.getMarket(id);
    if (!market) {
      throw new Error("Market not found");
    }
    
    if (market.status !== "closed") {
      throw new Error("Market must be closed before declaring result");
    }
    
    const updatedMarket = {
      ...market,
      status: "resulted",
      result,
      resultDeclaredAt: new Date(),
      resultDeclaredBy: declaredById,
    };
    this.markets.set(id, updatedMarket);
    
    // Process winning bets
    await this.processWinningBets(id, result);
    
    return { ...updatedMarket };
  }

  async getResults(): Promise<Market[]> {
    return Array.from(this.markets.values()).filter(
      (market) => market.status === "resulted"
    );
  }

  // Game type methods
  async createGameType(gameTypeData: InsertGameType): Promise<GameType> {
    const id = this.gameTypeIdCounter++;
    const gameType: GameType = {
      id,
      name: gameTypeData.name,
      description: gameTypeData.description,
      payoutMultiplier: gameTypeData.payoutMultiplier,
      gameCategory: gameTypeData.gameCategory,
    };
    this.gameTypes.set(id, gameType);
    return { ...gameType };
  }

  async getGameType(id: number): Promise<GameType | undefined> {
    return this.gameTypes.get(id);
  }

  async getAllGameTypes(): Promise<GameType[]> {
    return Array.from(this.gameTypes.values());
  }

  async getMarketGameTypes(marketId: number): Promise<GameType[]> {
    const market = await this.getMarket(marketId);
    if (!market) {
      throw new Error("Market not found");
    }
    
    const gameTypeIds = market.gameTypes as number[];
    return gameTypeIds.map(id => this.gameTypes.get(id)).filter(Boolean) as GameType[];
  }

  // Bet methods
  async placeBet(betData: InsertBet): Promise<Bet> {
    const id = this.betIdCounter++;
    const bet: Bet = {
      id,
      userId: betData.userId,
      marketId: betData.marketId,
      gameTypeId: betData.gameTypeId,
      betAmount: betData.betAmount,
      selection: betData.selection,
      placedAt: new Date(),
      status: "pending",
      potentialWin: betData.potentialWin,
      winAmount: null,
    };
    this.bets.set(id, bet);
    
    // Deduct bet amount from user balance
    const user = await this.getUser(betData.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const newBalance = Number(user.balance) - Number(betData.betAmount);
    await this.updateUserBalance(betData.userId, newBalance);
    
    // Record transaction
    await this.createTransaction({
      userId: betData.userId,
      amount: betData.betAmount,
      type: "bet",
      status: "completed",
      description: `Bet placed on ${betData.marketId}:${betData.gameTypeId} - ${betData.selection}`,
      betId: id,
    });
    
    return { ...bet };
  }

  async getUserBets(userId: number): Promise<any[]> {
    const userBets = Array.from(this.bets.values()).filter(
      (bet) => bet.userId === userId
    );
    
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
    
    // Sort by placed date (newest first)
    return enrichedBets.sort((a, b) => 
      new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
  }

  async getAllBets(): Promise<Bet[]> {
    return Array.from(this.bets.values());
  }

  async processWinningBets(marketId: number, result: string): Promise<void> {
    const marketBets = Array.from(this.bets.values()).filter(
      (bet) => bet.marketId === marketId && bet.status === "pending"
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
      }
      
      // Update bet status
      const updatedBet = {
        ...bet,
        status: isWinner ? "won" : "lost",
        winAmount: isWinner ? bet.potentialWin : "0",
      };
      this.bets.set(bet.id, updatedBet);
      
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
    const id = this.transactionIdCounter++;
    const transaction: Transaction = {
      id,
      userId: transactionData.userId,
      amount: transactionData.amount,
      type: transactionData.type,
      status: transactionData.status,
      description: transactionData.description,
      betId: transactionData.betId || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return { ...transaction };
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();

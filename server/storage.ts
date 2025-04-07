import { users, type User, type InsertUser, markets, type Market, type InsertMarket, gameTypes, type GameType, type InsertGameType, bets, type Bet, type InsertBet, transactions, type Transaction, type InsertTransaction } from "@shared/schema";
import session from "express-session";

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
  sessionStore: session.Store;
}

// Import and use DatabaseStorage instead of MemStorage
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();

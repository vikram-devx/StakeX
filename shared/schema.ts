import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("1000"),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Markets
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, open, closing_soon, closed, resulted
  openingTime: timestamp("opening_time").notNull(),
  closingTime: timestamp("closing_time").notNull(),
  createdBy: integer("created_by").notNull(),
  gameTypes: json("game_types").notNull(), // Array of game type ids
  result: text("result"),
  resultDeclaredAt: timestamp("result_declared_at"),
  resultDeclaredBy: integer("result_declared_by"),
});

export const insertMarketSchema = createInsertSchema(markets)
  .pick({
    name: true,
    openingTime: true,
    closingTime: true,
    createdBy: true,
    gameTypes: true,
  })
  .extend({
    // Override the timestamp fields to accept strings and convert to dates
    openingTime: z.string().or(z.date()).transform(val => new Date(val)),
    closingTime: z.string().or(z.date()).transform(val => new Date(val)),
  });

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;

// Game Types
export const gameTypes = pgTable("game_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  payoutMultiplier: decimal("payout_multiplier", { precision: 10, scale: 2 }).notNull(),
  gameCategory: text("game_category").notNull(), // sattamatka, cointoss
});

export const insertGameTypeSchema = createInsertSchema(gameTypes).pick({
  name: true,
  description: true,
  payoutMultiplier: true,
  gameCategory: true,
});

export type InsertGameType = z.infer<typeof insertGameTypeSchema>;
export type GameType = typeof gameTypes.$inferSelect;

// Bets
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  marketId: integer("market_id").notNull(),
  gameTypeId: integer("game_type_id").notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  selection: text("selection").notNull(),
  placedAt: timestamp("placed_at").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, won, lost
  potentialWin: decimal("potential_win", { precision: 10, scale: 2 }).notNull(),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }),
});

export const insertBetSchema = createInsertSchema(bets).pick({
  userId: true,
  marketId: true,
  gameTypeId: true,
  betAmount: true,
  selection: true,
  potentialWin: true,
});

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // deposit, withdrawal, bet, win
  status: text("status").notNull(), // completed, pending, failed
  description: text("description").notNull(),
  betId: integer("bet_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  status: true,
  description: true,
  betId: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

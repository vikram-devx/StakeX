import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMarketSchema, insertBetSchema, insertGameTypeSchema } from "@shared/schema";
import { z } from "zod";

// Middleware for checking admin role
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

// Middleware for checking authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Initialize with default game types and admin user if needed
  await initializeData();

  // Markets routes
  app.get("/api/markets", isAuthenticated, async (req, res) => {
    try {
      const markets = await storage.getActiveMarkets();
      res.json(markets);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get("/api/markets/all", isAdmin, async (req, res) => {
    try {
      const markets = await storage.getAllMarkets();
      res.json(markets);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get("/api/markets/:id", isAuthenticated, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const market = await storage.getMarket(marketId);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      res.json(market);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post("/api/markets", isAdmin, async (req, res) => {
    try {
      const marketData = insertMarketSchema.parse(req.body);
      const market = await storage.createMarket(marketData);
      res.status(201).json(market);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.patch("/api/markets/:id/status", isAdmin, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const { status } = req.body;
      if (!["pending", "open", "closing_soon", "closed", "resulted"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const market = await storage.updateMarketStatus(marketId, status);
      res.json(market);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post("/api/markets/:id/result", isAdmin, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const { result } = req.body;
      if (!result) {
        return res.status(400).json({ message: "Result is required" });
      }
      
      // Declare the result and process winners
      const processedMarket = await storage.declareResult(marketId, result, req.user!.id);
      res.json(processedMarket);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Game types routes
  app.get("/api/gametypes", isAuthenticated, async (req, res) => {
    try {
      const gameTypes = await storage.getAllGameTypes();
      res.json(gameTypes);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get("/api/gametypes/:id", isAuthenticated, async (req, res) => {
    try {
      const gameTypeId = parseInt(req.params.id);
      const gameType = await storage.getGameType(gameTypeId);
      if (!gameType) {
        return res.status(404).json({ message: "Game type not found" });
      }
      res.json(gameType);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post("/api/gametypes", isAdmin, async (req, res) => {
    try {
      const gameTypeData = insertGameTypeSchema.parse(req.body);
      const gameType = await storage.createGameType(gameTypeData);
      res.status(201).json(gameType);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Market game types route
  app.get("/api/markets/:id/gametypes", isAuthenticated, async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const gameTypes = await storage.getMarketGameTypes(marketId);
      res.json(gameTypes);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Bets routes
  app.get("/api/bets", isAdmin, async (req, res) => {
    try {
      const bets = await storage.getAllBets();
      res.json(bets);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get("/api/users/:userId/bets", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Only allow users to see their own bets or admins to see any user's bets
      if (req.user!.id !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const bets = await storage.getUserBets(userId);
      res.json(bets);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post("/api/bets", isAuthenticated, async (req, res) => {
    try {
      // Ensure user is placing bet for themselves
      if (req.body.userId !== req.user!.id) {
        return res.status(403).json({ message: "Cannot place bets for another user" });
      }

      const betData = insertBetSchema.parse(req.body);
      
      // Check if market is open for betting
      const market = await storage.getMarket(betData.marketId);
      if (!market || market.status !== "open" && market.status !== "closing_soon") {
        return res.status(400).json({ message: "Market is not open for betting" });
      }

      // Check if game type exists and is valid for this market
      const gameType = await storage.getGameType(betData.gameTypeId);
      if (!gameType) {
        return res.status(400).json({ message: "Game type not found" });
      }

      // Check if user has sufficient balance
      const user = await storage.getUser(betData.userId);
      if (!user || Number(user.balance) < Number(betData.betAmount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Place the bet and deduct balance
      const bet = await storage.placeBet(betData);
      res.status(201).json(bet);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors });
      }
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Results route
  app.get("/api/results", isAuthenticated, async (req, res) => {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Users route (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize default data
async function initializeData() {
  try {
    // Create default game types if they don't exist
    const gameTypes = await storage.getAllGameTypes();
    if (gameTypes.length === 0) {
      // Satta Matka game types
      await storage.createGameType({
        name: "Jodi",
        description: "Choose a two-digit number (00-99). Win if your number matches the result.",
        payoutMultiplier: 90,
        gameCategory: "sattamatka"
      });

      await storage.createGameType({
        name: "Hurf",
        description: "Choose a single digit (0-9). Win if your digit appears in the result.",
        payoutMultiplier: 9,
        gameCategory: "sattamatka"
      });

      await storage.createGameType({
        name: "Cross",
        description: "Choose two digits. Win if both digits appear in the result in any order.",
        payoutMultiplier: 15,
        gameCategory: "sattamatka"
      });

      await storage.createGameType({
        name: "Odd-Even",
        description: "Choose whether the result will be odd or even.",
        payoutMultiplier: 1.9,
        gameCategory: "sattamatka"
      });

      // Coin Toss game type
      await storage.createGameType({
        name: "Heads/Tails",
        description: "Choose either heads or tails. Win if your selection matches the result.",
        payoutMultiplier: 1.9,
        gameCategory: "cointoss"
      });
    }

    // Create admin user if no users exist
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      await storage.createUser({
        username: "admin",
        password: "$2b$10$X7tEhkJ6Kvs0YlhzpKl5D.PGQmzuZ39rBzHYFBRFPcxbDKGOkLJXi", // 'password'
        role: "admin"
      });
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}

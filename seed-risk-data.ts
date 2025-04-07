
import { db } from './server/db';
import { users, bets, transactions, markets, gameTypes } from './shared/schema';
import { eq } from 'drizzle-orm';

async function seedRiskData() {
  try {
    console.log('Seeding risk management data...');

    // Get admin user
    const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }

    // Create test users with different risk profiles
    const testUsers = await Promise.all([
      db.insert(users).values({
        username: 'high_risk_user',
        password: adminUser.password, // Using same hashed password as admin for testing
        balance: 100000,
        role: 'user'
      }).returning(),
      db.insert(users).values({
        username: 'medium_risk_user',
        password: adminUser.password,
        balance: 50000,
        role: 'user'
      }).returning(),
      db.insert(users).values({
        username: 'low_risk_user',
        password: adminUser.password,
        balance: 10000,
        role: 'user'
      }).returning()
    ]);

    // Get existing markets and game types
    const existingMarkets = await db.select().from(markets);
    const existingGameTypes = await db.select().from(gameTypes);

    if (existingMarkets.length === 0 || existingGameTypes.length === 0) {
      console.error('No markets or game types found. Please seed markets first.');
      return;
    }

    // Create test bets with varying amounts and risks
    const betData = [];
    for (const user of testUsers.flat()) {
      // High risk user places large bets
      if (user.username === 'high_risk_user') {
        for (let i = 0; i < 10; i++) {
          betData.push({
            userId: user.id,
            marketId: existingMarkets[0].id,
            gameTypeId: existingGameTypes[0].id,
            betAmount: 10000,
            selection: 'high_stake_bet',
            status: 'pending',
            potentialWin: 19000,
            placedAt: new Date()
          });
        }
      }
      
      // Medium risk user places moderate bets
      if (user.username === 'medium_risk_user') {
        for (let i = 0; i < 5; i++) {
          betData.push({
            userId: user.id,
            marketId: existingMarkets[0].id,
            gameTypeId: existingGameTypes[0].id,
            betAmount: 5000,
            selection: 'medium_stake_bet',
            status: 'pending',
            potentialWin: 9500,
            placedAt: new Date()
          });
        }
      }

      // Low risk user places small bets
      if (user.username === 'low_risk_user') {
        for (let i = 0; i < 3; i++) {
          betData.push({
            userId: user.id,
            marketId: existingMarkets[0].id,
            gameTypeId: existingGameTypes[0].id,
            betAmount: 1000,
            selection: 'low_stake_bet',
            status: 'pending',
            potentialWin: 1900,
            placedAt: new Date()
          });
        }
      }
    }

    // Insert all bets
    await db.insert(bets).values(betData);

    // Create some transactions for tracking
    for (const user of testUsers.flat()) {
      await db.insert(transactions).values([
        {
          userId: user.id,
          amount: 50000,
          type: 'deposit',
          status: 'completed',
          description: 'Initial deposit',
        },
        {
          userId: user.id,
          amount: -10000,
          type: 'bet',
          status: 'completed',
          description: 'Bet placement',
        }
      ]);
    }

    console.log('Risk management data seeded successfully!');
  } catch (error) {
    console.error('Error seeding risk data:', error);
  }
}

seedRiskData();

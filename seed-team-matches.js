// This script seeds the database with team matches for visualization purposes

import { db } from './server/db.js';
import { eq } from 'drizzle-orm';
import { users, markets, gameTypes } from './shared/schema.js';

async function seedTeamMatches() {
  try {
    console.log('Seeding team matches...');

    // Get admin user for creating markets
    const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin'));
    
    if (!adminUser) {
      console.error('Admin user not found. Please create an admin user first.');
      return;
    }

    // Create IPL market
    const [iplMarket] = await db
      .insert(markets)
      .values({
        name: 'IPL 2025',
        description: 'Indian Premier League matches for the 2025 season',
        status: 'open',
        openingTime: new Date().toISOString(),
        closingTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        createdById: adminUser.id,
        bannerImage: 'https://assets.bcci.tv/bcci/photos/1050/6ac41d6f-c18a-45b9-a07d-197d144e27cb.jpg',
        gameTypes: []
      })
      .returning();

    // Create World Cup market
    const [worldCupMarket] = await db
      .insert(markets)
      .values({
        name: 'T20 World Cup',
        description: 'International T20 World Cup matches',
        status: 'open',
        openingTime: new Date().toISOString(),
        closingTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        createdById: adminUser.id,
        bannerImage: 'https://img.jagranjosh.com/images/2023/June/1062023/t20-world-cup-2024-schedule.jpg',
        gameTypes: []
      })
      .returning();

    // Create team match game types for IPL
    const iplMatches = [
      {
        name: 'CSK vs MI',
        description: 'Chennai Super Kings vs Mumbai Indians',
        gameCategory: 'teamMatch',
        team1: 'Chennai Super Kings',
        team2: 'Mumbai Indians',
        teamLogoUrl1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Logooutline/CSKoutline.png',
        teamLogoUrl2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Logooutline/MIoutline.png',
        payoutMultiplier: '1.95'
      },
      {
        name: 'RCB vs KKR',
        description: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
        gameCategory: 'teamMatch',
        team1: 'Royal Challengers Bangalore',
        team2: 'Kolkata Knight Riders',
        teamLogoUrl1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Logooutline/RCBoutline.png',
        teamLogoUrl2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Logooutline/KKRoutline.png',
        payoutMultiplier: '1.85'
      },
      {
        name: 'GT vs RR',
        description: 'Gujarat Titans vs Rajasthan Royals',
        gameCategory: 'teamMatch',
        team1: 'Gujarat Titans',
        team2: 'Rajasthan Royals',
        teamLogoUrl1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/Logos/Logooutline/GToutline.png',
        teamLogoUrl2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/Logos/Logooutline/RRoutline.png',
        payoutMultiplier: '1.9'
      }
    ];

    // Create team match game types for World Cup
    const worldCupMatches = [
      {
        name: 'IND vs PAK',
        description: 'India vs Pakistan',
        gameCategory: 'teamMatch',
        team1: 'India',
        team2: 'Pakistan',
        teamLogoUrl1: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1280px-Flag_of_India.svg.png',
        teamLogoUrl2: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/1280px-Flag_of_Pakistan.svg.png',
        payoutMultiplier: '1.8'
      },
      {
        name: 'AUS vs ENG',
        description: 'Australia vs England',
        gameCategory: 'teamMatch',
        team1: 'Australia',
        team2: 'England',
        teamLogoUrl1: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1280px-Flag_of_Australia_%28converted%29.svg.png',
        teamLogoUrl2: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1280px-Flag_of_England.svg.png',
        payoutMultiplier: '1.95'
      }
    ];

    // Add game types to IPL market
    for (const match of iplMatches) {
      const [gameType] = await db
        .insert(gameTypes)
        .values({
          ...match,
          marketId: iplMarket.id
        })
        .returning();

      // Update the market with the new game type
      await db
        .update(markets)
        .set({
          gameTypes: [...(iplMarket.gameTypes || []), gameType.id]
        })
        .where(eq(markets.id, iplMarket.id));
    }

    // Add game types to World Cup market
    for (const match of worldCupMatches) {
      const [gameType] = await db
        .insert(gameTypes)
        .values({
          ...match,
          marketId: worldCupMarket.id
        })
        .returning();

      // Update the market with the new game type
      await db
        .update(markets)
        .set({
          gameTypes: [...(worldCupMarket.gameTypes || []), gameType.id]
        })
        .where(eq(markets.id, worldCupMarket.id));
    }

    console.log('Team matches seeded successfully!');
  } catch (error) {
    console.error('Error seeding team matches:', error);
  }
}

seedTeamMatches();
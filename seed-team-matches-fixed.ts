import { db } from './server/db';
import { markets, gameTypes, users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function seedTeamMatches() {
  try {
    console.log('Seeding team matches...');
    
    // Find admin user
    const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin'));
    
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
        opening_time: new Date(),
        closing_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        created_by: adminUser.id,
        banner_image: 'https://assets.bcci.tv/bcci/photos/1050/6ac41d6f-c18a-45b9-a07d-197d144e27cb.jpg',
        game_types: []
      })
      .returning();

    // Create World Cup market
    const [worldCupMarket] = await db
      .insert(markets)
      .values({
        name: 'T20 World Cup',
        description: 'International T20 World Cup matches',
        status: 'open',
        opening_time: new Date(),
        closing_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        created_by: adminUser.id,
        banner_image: 'https://img.jagranjosh.com/images/2023/June/1062023/t20-world-cup-2024-schedule.jpg',
        game_types: []
      })
      .returning();

    // Create team match game types for IPL
    const iplMatches = [
      {
        name: 'CSK vs MI',
        description: 'Chennai Super Kings vs Mumbai Indians',
        game_category: 'teamMatch',
        team1: 'Chennai Super Kings',
        team2: 'Mumbai Indians',
        team_logo_url1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Logooutline/CSKoutline.png',
        team_logo_url2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Logooutline/MIoutline.png',
        payout_multiplier: '1.95'
      },
      {
        name: 'RCB vs KKR',
        description: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
        game_category: 'teamMatch',
        team1: 'Royal Challengers Bangalore',
        team2: 'Kolkata Knight Riders',
        team_logo_url1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Logooutline/RCBoutline.png',
        team_logo_url2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Logooutline/KKRoutline.png',
        payout_multiplier: '1.85'
      },
      {
        name: 'GT vs RR',
        description: 'Gujarat Titans vs Rajasthan Royals',
        game_category: 'teamMatch',
        team1: 'Gujarat Titans',
        team2: 'Rajasthan Royals',
        team_logo_url1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/Logos/Logooutline/GToutline.png',
        team_logo_url2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/Logos/Logooutline/RRoutline.png',
        payout_multiplier: '1.9'
      }
    ];

    // Create team match game types for World Cup
    const worldCupMatches = [
      {
        name: 'IND vs PAK',
        description: 'India vs Pakistan',
        game_category: 'teamMatch',
        team1: 'India',
        team2: 'Pakistan',
        team_logo_url1: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1280px-Flag_of_India.svg.png',
        team_logo_url2: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/1280px-Flag_of_Pakistan.svg.png',
        payout_multiplier: '1.8'
      },
      {
        name: 'AUS vs ENG',
        description: 'Australia vs England',
        game_category: 'teamMatch',
        team1: 'Australia',
        team2: 'England',
        team_logo_url1: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1280px-Flag_of_Australia_%28converted%29.svg.png',
        team_logo_url2: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1280px-Flag_of_England.svg.png',
        payout_multiplier: '1.95'
      }
    ];

    // Add game types to IPL market
    let iplGameTypeIds: number[] = [];
    for (const match of iplMatches) {
      const [gameType] = await db
        .insert(gameTypes)
        .values(match)
        .returning();

      iplGameTypeIds.push(gameType.id);
    }

    // Update the IPL market with the new game types
    await db
      .update(markets)
      .set({
        game_types: iplGameTypeIds
      })
      .where(eq(markets.id, iplMarket.id));

    // Add game types to World Cup market
    let worldCupGameTypeIds: number[] = [];
    for (const match of worldCupMatches) {
      const [gameType] = await db
        .insert(gameTypes)
        .values(match)
        .returning();

      worldCupGameTypeIds.push(gameType.id);
    }

    // Update the World Cup market with the new game types
    await db
      .update(markets)
      .set({
        game_types: worldCupGameTypeIds
      })
      .where(eq(markets.id, worldCupMarket.id));

    console.log('Team matches seeded successfully!');
  } catch (error) {
    console.error('Error seeding team matches:', error);
  }
}

seedTeamMatches();
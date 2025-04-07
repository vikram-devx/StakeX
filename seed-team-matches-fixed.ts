
import { db } from './server/db';
import { markets, gameTypes, users } from './shared/schema';
import { eq } from 'drizzle-orm';

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
        name: 'IPL 2024',
        description: 'Indian Premier League matches for the 2024 season',
        status: 'open',
        openingTime: new Date(),
        closingTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        bannerImage: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/bcci/images/1644917227_cropped.jpg',
        gameTypes: []
      })
      .returning();

    // Create T20 World Cup market
    const [worldCupMarket] = await db
      .insert(markets)
      .values({
        name: 'T20 World Cup 2024',
        description: 'International T20 World Cup matches',
        status: 'open',
        openingTime: new Date(),
        closingTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        bannerImage: 'https://cdn.wisden.com/wp-content/uploads/2024/02/t20-world-cup-2024-lead.jpg',
        gameTypes: []
      })
      .returning();

    // Create team match game types
    const matches = [
      {
        name: 'CSK vs MI',
        description: 'Chennai Super Kings vs Mumbai Indians',
        gameCategory: 'teamMatch',
        team1: 'Chennai Super Kings',
        team2: 'Mumbai Indians',
        teamLogoUrl1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Logooutline/CSKoutline.png',
        teamLogoUrl2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Logooutline/MIoutline.png',
        payoutMultiplier: '1.95',
        marketId: iplMarket.id
      },
      {
        name: 'RCB vs GT',
        description: 'Royal Challengers Bangalore vs Gujarat Titans',
        gameCategory: 'teamMatch',
        team1: 'Royal Challengers Bangalore',
        team2: 'Gujarat Titans',
        teamLogoUrl1: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Logooutline/RCBoutline.png',
        teamLogoUrl2: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/Logos/Logooutline/GToutline.png',
        payoutMultiplier: '1.85',
        marketId: iplMarket.id
      },
      {
        name: 'IND vs PAK',
        description: 'India vs Pakistan',
        gameCategory: 'teamMatch',
        team1: 'India',
        team2: 'Pakistan',
        teamLogoUrl1: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Flag_of_India.svg',
        teamLogoUrl2: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Flag_of_Pakistan.svg',
        payoutMultiplier: '1.8',
        marketId: worldCupMarket.id
      },
      {
        name: 'AUS vs ENG',
        description: 'Australia vs England',
        gameCategory: 'teamMatch',
        team1: 'Australia',
        team2: 'England',
        teamLogoUrl1: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Flag_of_Australia_%28converted%29.svg',
        teamLogoUrl2: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Flag_of_England.svg',
        payoutMultiplier: '1.9',
        marketId: worldCupMarket.id
      },
      {
        name: 'NZ vs SA',
        description: 'New Zealand vs South Africa',
        gameCategory: 'teamMatch',
        team1: 'New Zealand',
        team2: 'South Africa',
        teamLogoUrl1: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Flag_of_New_Zealand.svg',
        teamLogoUrl2: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Flag_of_South_Africa.svg',
        payoutMultiplier: '1.85',
        marketId: worldCupMarket.id
      }
    ];

    // Add matches
    for (const match of matches) {
      const [gameType] = await db
        .insert(gameTypes)
        .values(match)
        .returning();

      // Update market with new game type
      await db
        .update(markets)
        .set({
          gameTypes: [...(match.marketId === iplMarket.id ? iplMarket.gameTypes : worldCupMarket.gameTypes) || [], gameType.id]
        })
        .where(eq(markets.id, match.marketId));
    }

    console.log('Team matches seeded successfully!');
  } catch (error) {
    console.error('Error seeding team matches:', error);
  }
}

seedTeamMatches();

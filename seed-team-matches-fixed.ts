import { db } from './server/db';
import { markets, gameTypes, users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function seedTeamMatches() {
  try {
    console.log('No team matches to seed.');
  } catch (error) {
    console.error('Error seeding team matches:', error);
  }
}

seedTeamMatches();
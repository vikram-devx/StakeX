import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Create connection pool with pooler URL
const poolerUrl = process.env.DATABASE_URL?.replace('.us-east-2', '-pooler.us-east-2');
const pool = new pg.Pool({
  connectionString: poolerUrl,
  max: 10
});

// Create drizzle instance
export const db = drizzle(pool, { schema });
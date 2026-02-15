import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Always use SSL for Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds
});

pool.on("connect", () => {
  // Database connected silently
});

pool.on("error", (err: Error) => {
  console.error("❌ Unexpected database error:", err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const res = await pool.query(text, params);
  return res;
};

export default pool;

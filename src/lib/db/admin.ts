import postgres from 'postgres';

// Ensure this is only used in secure admin API routes!
export const sql = postgres(process.env.DATABASE_URL || '', {
  max: 10, // Max number of connections
  idle_timeout: 20, // Max idle time in seconds
  connect_timeout: 10,
});

export const hasDbUrl = !!process.env.DATABASE_URL;

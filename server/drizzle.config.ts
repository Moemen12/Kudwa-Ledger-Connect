export default {
  schema: './src/infrastructure/database/drizzle/schema/index.ts',
  out: './src/infrastructure/database/drizzle/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './data/kudwa-ledger.sqlite',
  },
};

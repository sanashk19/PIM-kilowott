import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'pim_sentinel.db'),
  ai: {
    provider: process.env.AI_PROVIDER || 'deterministic_fallback',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
  },
  woo: {
    activeDriver: (process.env.WOO_ACTIVE_DRIVER || 'mock') as 'mock' | 'live',
    storeUrl: process.env.WOO_STORE_URL || 'https://example-store.local',
    consumerKey: process.env.WOO_CONSUMER_KEY || 'ck_mock_key',
    consumerSecret: process.env.WOO_CONSUMER_SECRET || 'cs_mock_secret',
    simulateFailure: process.env.MOCK_WOO_SIMULATE_FAILURE === 'true',
  },
};

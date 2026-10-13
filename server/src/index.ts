import { app } from './app.js';
import { config } from './config/env.js';
import { initializeSchema } from './db/schema.js';

// Ensure schema is created on startup
initializeSchema();

app.listen(config.port, () => {
  console.log(`🚀 PIM Sentinel API server running on http://127.0.0.1:${config.port}`);
  console.log(`📦 Database: ${config.dbPath}`);
  console.log(`🤖 AI Provider: ${config.ai.provider}`);
  console.log(`🛒 WooCommerce Driver: ${config.woo.activeDriver}`);
});

import { WooCommerceClient } from './WooCommerceClient.js';
import { MockWooCommerceClient } from './MockWooCommerceClient.js';
import { LiveWooCommerceClient } from './LiveWooCommerceClient.js';
import { getDb } from '../db/connection.js';
import { config } from '../config/env.js';

export class WooCommerceFactory {
  private static mockInstance: MockWooCommerceClient | null = null;

  public static getClient(): WooCommerceClient {
    const db = getDb();
    const driverRow = db.prepare("SELECT value FROM settings WHERE key = 'woo_active_driver'").get() as any;
    const activeDriver = driverRow ? driverRow.value : config.woo.activeDriver;

    if (activeDriver === 'live') {
      const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'woo_store_url'").get() as any;
      const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'woo_consumer_key'").get() as any;
      const secretRow = db.prepare("SELECT value FROM settings WHERE key = 'woo_consumer_secret'").get() as any;

      const storeUrl = urlRow ? urlRow.value : config.woo.storeUrl;
      const consumerKey = keyRow ? keyRow.value : config.woo.consumerKey;
      const consumerSecret = secretRow ? secretRow.value : config.woo.consumerSecret;

      return new LiveWooCommerceClient(storeUrl, consumerKey, consumerSecret);
    }

    if (!this.mockInstance) {
      this.mockInstance = new MockWooCommerceClient();
    }
    return this.mockInstance;
  }
}

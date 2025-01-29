import { config } from '@/config';
import type CacheModule from './base';
import Database from 'better-sqlite3';

const status = { available: false };
const clients: {
    sqliteCache?: any;
} = {};
const initDatabase = () => {
    const db = new Database('./cache.db');
    db.pragma('journal_mode = WAL');
    // 创建缓存表
    db.prepare(
        `
    CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT
    )
`
    ).run();
    return db;
};
export default {
    init: () => {
        clients.sqliteCache = initDatabase();
        status.available = true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get: (key: string, refresh = true) => {
        if (key && status.available && clients.sqliteCache) {
            let value = clients.sqliteCache.prepare(`SELECT value FROM cache WHERE key = ?`).get(key);
            value = value.value;
            // https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#getbindparameters---row
            if (value) {
                value = value + '';
            }
            return value;
        } else {
            return null;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set: (key, value, maxAge = config.cache.contentExpire) => {
        if (!value || value === 'undefined') {
            value = '';
        }
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        if (key && status.available && clients.sqliteCache) {
            return clients.sqliteCache.prepare(`INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)`).run(key, value);
        }
    },
    clients,
    status,
} as CacheModule;

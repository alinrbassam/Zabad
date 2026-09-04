import fs from 'fs';
import path from 'path';
import { StoreSnapshot, defaultDemoSnapshot } from './types';

export { type StoreSnapshot, defaultDemoSnapshot };

// In-memory global fallback
let memorySnapshot: StoreSnapshot | null = null;
const TMP_FILE = path.join('/tmp', 'zabad_store_snapshot.json');

export async function saveSnapshot(snapshot: StoreSnapshot): Promise<void> {
  // 1. Check Upstash / Vercel KV
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    try {
      await fetch(`${redisUrl}/set/zabad_store_snapshot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snapshot),
      });
      return;
    } catch (err) {
      console.warn('Failed saving to Upstash Redis, falling back to local cache', err);
    }
  }

  // 2. Fallback to memory and /tmp cache
  memorySnapshot = snapshot;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(snapshot), 'utf-8');
  } catch {
    // ignore serverless write restriction if any
  }
}

export async function getLatestSnapshot(): Promise<StoreSnapshot> {
  // 1. Check Upstash / Vercel KV
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/zabad_store_snapshot`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          const data = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed reading from Redis, using fallback', err);
    }
  }

  // 2. Check memory
  if (memorySnapshot) {
    return memorySnapshot;
  }

  // 3. Check /tmp
  try {
    if (fs.existsSync(TMP_FILE)) {
      const content = fs.readFileSync(TMP_FILE, 'utf-8');
      if (content) {
        memorySnapshot = JSON.parse(content);
        return memorySnapshot!;
      }
    }
  } catch {
    // ignore
  }

  return defaultDemoSnapshot;
}

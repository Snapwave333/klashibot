/**
 * Market Image Cache - Mini Database
 * Stores market images with automatic garbage collection
 */

interface CachedMarketImage {
  ticker: string;
  imageUrl: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

const CACHE_KEY = 'kalshi_market_image_cache';
const MAX_CACHE_SIZE = 100; // Maximum number of cached images
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const GC_INTERVAL_MS = 5 * 60 * 1000; // Run GC every 5 minutes

class MarketImageCache {
  private cache: Map<string, CachedMarketImage>;
  private gcInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
    this.startGarbageCollection();
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as CachedMarketImage[];
        data.forEach((item) => {
          this.cache.set(item.ticker, item);
        });
        console.log(`[MarketImageCache] Loaded ${this.cache.size} cached images`);
      }
    } catch (error) {
      console.error('[MarketImageCache] Failed to load from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem(CACHE_KEY, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[MarketImageCache] Failed to save to storage:', error);
    }
  }

  /**
   * Get cached image URL for a ticker
   */
  get(ticker: string): string | null {
    const cached = this.cache.get(ticker);
    if (!cached) return null;

    // Update access stats
    cached.accessCount++;
    cached.lastAccessed = Date.now();
    this.cache.set(ticker, cached);

    return cached.imageUrl;
  }

  /**
   * Cache an image URL for a ticker
   */
  set(ticker: string, imageUrl: string): void {
    const now = Date.now();

    this.cache.set(ticker, {
      ticker,
      imageUrl,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    });

    // Trigger GC if cache is too large
    if (this.cache.size > MAX_CACHE_SIZE) {
      this.garbageCollect();
    }

    this.saveToStorage();
  }

  /**
   * Check if ticker is in cache and not expired
   */
  has(ticker: string): boolean {
    const cached = this.cache.get(ticker);
    if (!cached) return false;

    const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRY_MS;
    if (isExpired) {
      this.cache.delete(ticker);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  /**
   * Garbage collection - remove old/unused entries
   */
  garbageCollect(): void {
    const now = Date.now();
    let removed = 0;

    // Remove expired entries
    const entries = Array.from(this.cache.entries());
    entries.forEach(([ticker, cached]) => {
      if (now - cached.timestamp > CACHE_EXPIRY_MS) {
        this.cache.delete(ticker);
        removed++;
      }
    });

    // If still too large, remove least recently used
    if (this.cache.size > MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries());
      sortedEntries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const toRemove = this.cache.size - MAX_CACHE_SIZE;
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(sortedEntries[i][0]);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(
        `[MarketImageCache] GC: Removed ${removed} entries, ${this.cache.size} remaining`
      );
      this.saveToStorage();
    }
  }

  /**
   * Start automatic garbage collection
   */
  private startGarbageCollection(): void {
    // Run initial GC
    this.garbageCollect();

    // Schedule periodic GC
    this.gcInterval = setInterval(() => {
      this.garbageCollect();
    }, GC_INTERVAL_MS);
  }

  /**
   * Stop garbage collection (cleanup)
   */
  stopGarbageCollection(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; totalAccesses: number; oldestEntry: number } {
    let totalAccesses = 0;
    let oldestTimestamp = Date.now();

    const values = Array.from(this.cache.values());
    values.forEach((cached) => {
      totalAccesses += cached.accessCount;
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
      }
    });

    return {
      size: this.cache.size,
      totalAccesses,
      oldestEntry: Date.now() - oldestTimestamp,
    };
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    localStorage.removeItem(CACHE_KEY);
    console.log('[MarketImageCache] Cache cleared');
  }
}

// Singleton instance
export const marketImageCache = new MarketImageCache();

/**
 * Fetch market image from Kalshi API or cache
 */
export async function getMarketImage(ticker: string): Promise<string | null> {
  // Check cache first
  if (marketImageCache.has(ticker)) {
    const cached = marketImageCache.get(ticker);
    if (cached) return cached;
  }

  try {
    // Fetch from Kalshi API
    const response = await fetch(`https://kalshi.com/api/markets/${ticker}`);
    if (!response.ok) {
      console.warn(`[MarketImageCache] Failed to fetch market ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Extract image URL from response
    // Kalshi API typically returns: market.banner_image or market.image_url
    const imageUrl = data?.market?.banner_image || data?.market?.image_url || data?.image_url;

    if (imageUrl) {
      // Cache the image URL
      marketImageCache.set(ticker, imageUrl);
      return imageUrl;
    }

    // Fallback to default Kalshi market image
    const fallbackUrl = `https://kalshi.com/assets/market-default.png`;
    marketImageCache.set(ticker, fallbackUrl);
    return fallbackUrl;
  } catch (error) {
    console.error(`[MarketImageCache] Error fetching image for ${ticker}:`, error);
    return null;
  }
}

/**
 * Preload market images for multiple tickers
 */
export async function preloadMarketImages(tickers: string[]): Promise<void> {
  const promises = tickers.map((ticker) => getMarketImage(ticker));
  await Promise.allSettled(promises);
}

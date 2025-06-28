// SnarkJS loader utility (TypeScript)
// Handles dynamic <script> injection with retry + version helpers
// Lints clean against @typescript-eslint/no-explicit-any and TS2790.

export class SnarkjsLoader {
  private static loaded = false;
  private static loading = false;
  private static loadPromise: Promise<void> | null = null;

  /**
   * Dynamically load snarkjs from a CDN (with retry & caching).
   */
  static async load(): Promise<void> {
    // Already loaded → exit fast
    if (this.loaded && typeof window !== 'undefined' && window.snarkjs) {
      return;
    }

    // In‑flight request → await the same promise
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    // Begin loading
    this.loading = true;
    this.loadPromise = this.loadSnarkjs();

    try {
      await this.loadPromise;
      this.loaded = true;
      console.log('✅ SnarkJS loaded successfully');
    } finally {
      // always reset loading flag
      this.loading = false;
    }

    return this.loadPromise;
  }

  /** Check global availability */
  static isLoaded(): boolean {
    return typeof window !== 'undefined' && !!window.snarkjs && this.loaded;
  }

  /** Whether a load() call is currently in progress */
  static isLoading(): boolean {
    return this.loading;
  }

  /** Force a fresh reload (e.g. after CDN failure) */
  static async reload(): Promise<void> {
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;

    // Remove any existing <script> tag
    if (typeof document !== 'undefined') {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="snarkjs"]');
      existing?.remove();
    }

    // Clear the cached global (avoid TS2790 delete issue)
    (window as { snarkjs?: unknown }).snarkjs = undefined;

    return this.load();
  }

  /** Low‑level script injection with multiple fall‑back CDNs */
  private static loadSnarkjs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        reject(new Error('Not running in a browser environment'));
        return;
      }

      if (window.snarkjs) {
        // already present via other means
        this.loaded = true;
        resolve();
        return;
      }

      const sources = [
        'https://unpkg.com/snarkjs@latest/build/snarkjs.min.js',
        'https://cdn.jsdelivr.net/npm/snarkjs@latest/build/snarkjs.min.js',
        'https://cdn.skypack.dev/snarkjs'
      ];

      let idx = 0;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;

      const tryNextSource = (): void => {
        if (idx >= sources.length) {
          reject(new Error('All SnarkJS sources failed to load'));
          return;
        }

        script.src = sources[idx];
        console.log(`📦 Attempting to load SnarkJS from: ${script.src}`);
        idx += 1;

        const timeoutId = window.setTimeout(() => {
          console.warn(`⏰ Timeout loading ${script.src}`);
          tryNextSource();
        }, 10_000);

        script.onload = () => {
          window.clearTimeout(timeoutId);
          // Wait a tiny tick so global attaches
          setTimeout(() => {
            if (window.snarkjs) {
              resolve();
            } else {
              console.warn(`⚠️ Script loaded but snarkjs global missing: ${script.src}`);
              tryNextSource();
            }
          }, 100);
        };

        script.onerror = (err) => {
          window.clearTimeout(timeoutId);
          console.warn(`❌ Failed loading ${script.src}`, err);
          tryNextSource();
        };
      };

      tryNextSource();
      document.head.appendChild(script);
    });
  }

  /** Preload with exponential retry */
  static async preload(maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        console.log(`🔄 Loading SnarkJS (attempt ${attempt}/${maxRetries})…`);
        await this.load();
        return; // success
      } catch (err) {
        if (attempt === maxRetries) throw err;
        console.warn(`Retrying SnarkJS load (${attempt})…`);
        await new Promise((r) => setTimeout(r, 1_000 * attempt));
      }
    }
  }

  /** Return reported snarkjs version, if any */
  static getVersion(): string | null {
    return this.isLoaded() && (window.snarkjs as { version?: string }).version || null;
  }

  /** Quick self‑test (checks groth16 presence) */
  static async test(): Promise<boolean> {
    if (!this.isLoaded()) return false;
    try {
      return !!window.snarkjs?.groth16;
    } catch {
      return false;
    }
  }
}

// ───────────────────────────────────────────────────────────
// Global ambient types
// ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    snarkjs?: {
      groth16: {
        fullProve: (
          input: Record<string, unknown>,
          wasmPath: string,
          zkeyPath: string
        ) => Promise<Record<string, unknown>>;
        verify: (
          vKey: Record<string, unknown>,
          publicSignals: string[],
          proof: Record<string, unknown>
        ) => Promise<boolean>;
        prove: (
          zkeyPath: string,
          witness: Record<string, unknown>
        ) => Promise<Record<string, unknown>>;
      };
      version?: string;
    };
  }
}

// Handy re‑exports
export const loadSnarkjs = SnarkjsLoader.load.bind(SnarkjsLoader);
export const isSnarkjsLoaded = SnarkjsLoader.isLoaded.bind(SnarkjsLoader);
export const preloadSnarkjs = SnarkjsLoader.preload.bind(SnarkjsLoader);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RuntimeData } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store in data/runtime.json relative to root project folder
const DATA_DIR = path.resolve(__dirname, '../../data');
const FILE_PATH = path.join(DATA_DIR, 'runtime.json');
const TMP_FILE_PATH = path.join(DATA_DIR, 'runtime.json.tmp');

class PersistenceService {
  private writeQueue: Promise<void> = Promise.resolve();
  private inMemoryCache: RuntimeData | null = null;

  private ensureDirectoryExists() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('PersistenceService: Warning ensuring directory exists:', err);
    }
  }

  public getDataSync(): RuntimeData {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    this.ensureDirectoryExists();
    if (!fs.existsSync(FILE_PATH)) {
      const empty = this.createEmptyData();
      this.inMemoryCache = empty;
      return empty;
    }

    try {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const sanitized = this.sanitizeData(parsed);
      this.inMemoryCache = sanitized;
      return sanitized;
    } catch (err) {
      console.error('PersistenceService: Error reading runtime.json, initializing empty data:', err);
      const empty = this.createEmptyData();
      this.inMemoryCache = empty;
      return empty;
    }
  }

  public async getData(): Promise<RuntimeData> {
    return this.getDataSync();
  }

  public async saveData(data: RuntimeData): Promise<void> {
    // 1. Update in-memory cache instantly so the server remains 100% responsive
    this.inMemoryCache = data;

    // 2. Queue write operations to ensure atomic sequential execution
    this.writeQueue = this.writeQueue
      .then(async () => {
        await this.atomicWriteWithRetry(data);
      })
      .catch(err => {
        console.error('PersistenceService: Error in write queue execution:', err);
      });

    return this.writeQueue;
  }

  public async updateData(updater: (data: RuntimeData) => void | Promise<void>): Promise<RuntimeData> {
    const data = await this.getData();
    await updater(data);
    await this.saveData(data);
    return data;
  }

  /**
   * Performs an atomic write using temporary file swap with Windows EPERM/EBUSY lock retry logic
   * and fallback file copying.
   */
  private async atomicWriteWithRetry(data: RuntimeData): Promise<void> {
    this.ensureDirectoryExists();
    const payload = JSON.stringify(data, null, 2);

    // Step 1: Write to temporary file with retry
    let tempWriteSuccess = false;
    for (let i = 0; i < 3; i++) {
      try {
        await fs.promises.writeFile(TMP_FILE_PATH, payload, 'utf-8');
        tempWriteSuccess = true;
        break;
      } catch (err) {
        await new Promise(r => setTimeout(r, 50 * (i + 1)));
      }
    }

    if (!tempWriteSuccess) {
      // Fallback: try writing directly to target file if temp file write fails
      try {
        await fs.promises.writeFile(FILE_PATH, payload, 'utf-8');
      } catch (err) {
        console.error('PersistenceService: Fallback direct write failed:', err);
      }
      return;
    }

    // Step 2: Atomic rename with exponential backoff retries for Windows file locks
    const maxRetries = 6;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        await fs.promises.rename(TMP_FILE_PATH, FILE_PATH);
        return; // Success!
      } catch (err: any) {
        attempt++;
        const isLockError = err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES';

        if (!isLockError || attempt >= maxRetries) {
          // Fallback strategy: Copy temp file over primary target file, then clean up temp file
          try {
            await fs.promises.copyFile(TMP_FILE_PATH, FILE_PATH);
            try {
              if (fs.existsSync(TMP_FILE_PATH)) {
                await fs.promises.unlink(TMP_FILE_PATH);
              }
            } catch (_) {}
            return;
          } catch (copyErr) {
            console.error(`PersistenceService: Copy fallback failed after rename lock (Attempt ${attempt}):`, copyErr);
            // Clean up temp file safely
            try {
              if (fs.existsSync(TMP_FILE_PATH)) {
                await fs.promises.unlink(TMP_FILE_PATH);
              }
            } catch (_) {}
            return;
          }
        }

        // Exponential backoff delay with random jitter (e.g., 50ms, 100ms, 200ms, 400ms...)
        const delay = Math.pow(2, attempt) * 25 + Math.floor(Math.random() * 30);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private createEmptyData(): RuntimeData {
    return {
      users: [],
      memberProfiles: [],
      membershipPlans: [],
      memberships: [],
      trainers: [],
      classes: [],
      bookings: [],
      attendance: [],
      payments: [],
      activities: [],
      sessions: [],
      auditLogs: [],
      metadata: {
        initializedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  private sanitizeData(raw: any): RuntimeData {
    const empty = this.createEmptyData();
    return {
      users: Array.isArray(raw?.users) ? raw.users : [],
      memberProfiles: Array.isArray(raw?.memberProfiles) ? raw.memberProfiles : [],
      membershipPlans: Array.isArray(raw?.membershipPlans) ? raw.membershipPlans : [],
      memberships: Array.isArray(raw?.memberships) ? raw.memberships : [],
      trainers: Array.isArray(raw?.trainers) ? raw.trainers : [],
      classes: Array.isArray(raw?.classes) ? raw.classes : [],
      bookings: Array.isArray(raw?.bookings) ? raw.bookings : [],
      attendance: Array.isArray(raw?.attendance) ? raw.attendance : [],
      payments: Array.isArray(raw?.payments) ? raw.payments : [],
      activities: Array.isArray(raw?.activities) ? raw.activities : [],
      sessions: Array.isArray(raw?.sessions) ? raw.sessions : [],
      auditLogs: Array.isArray(raw?.auditLogs) ? raw.auditLogs : [],
      metadata: raw?.metadata || empty.metadata
    };
  }
}

export const persistenceService = new PersistenceService();

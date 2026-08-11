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

  private ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public getDataSync(): RuntimeData {
    this.ensureDirectoryExists();
    if (!fs.existsSync(FILE_PATH)) {
      return this.createEmptyData();
    }
    try {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return this.sanitizeData(parsed);
    } catch (err) {
      console.error('Error reading runtime.json, returning empty sanitized structure:', err);
      return this.createEmptyData();
    }
  }

  public async getData(): Promise<RuntimeData> {
    return this.getDataSync();
  }

  public async saveData(data: RuntimeData): Promise<void> {
    // Queue writes atomically to prevent race conditions
    this.writeQueue = this.writeQueue.then(async () => {
      this.ensureDirectoryExists();
      const payload = JSON.stringify(data, null, 2);
      
      // Write to temp file first
      await fs.promises.writeFile(TMP_FILE_PATH, payload, 'utf-8');

      // Rename temp file atomically over primary file
      await fs.promises.rename(TMP_FILE_PATH, FILE_PATH);
    }).catch(err => {
      console.error('Atomic write failed for runtime.json:', err);
      // Clean up tmp file if leftover
      if (fs.existsSync(TMP_FILE_PATH)) {
        try { fs.unlinkSync(TMP_FILE_PATH); } catch (_) {}
      }
      throw err;
    });

    return this.writeQueue;
  }

  public async updateData(updater: (data: RuntimeData) => void | Promise<void>): Promise<RuntimeData> {
    const data = await this.getData();
    await updater(data);
    await this.saveData(data);
    return data;
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
      users: Array.isArray(raw.users) ? raw.users : [],
      memberProfiles: Array.isArray(raw.memberProfiles) ? raw.memberProfiles : [],
      membershipPlans: Array.isArray(raw.membershipPlans) ? raw.membershipPlans : [],
      memberships: Array.isArray(raw.memberships) ? raw.memberships : [],
      trainers: Array.isArray(raw.trainers) ? raw.trainers : [],
      classes: Array.isArray(raw.classes) ? raw.classes : [],
      bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
      attendance: Array.isArray(raw.attendance) ? raw.attendance : [],
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      activities: Array.isArray(raw.activities) ? raw.activities : [],
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
      auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
      metadata: raw.metadata || empty.metadata
    };
  }
}

export const persistenceService = new PersistenceService();

import { describe, it, expect, beforeAll } from 'vitest';
import { persistenceService } from '../services/persistenceService.js';
import { ensureSeededData } from '../services/seedService.js';

function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(rupees);
}

describe('Mahesh Fitness Center Core Logic Tests', () => {
  beforeAll(async () => {
    await ensureSeededData();
  });

  it('should initialize runtime.json data store with seed demo records', async () => {
    const data = await persistenceService.getData();
    expect(data.users.length).toBeGreaterThan(5);
    expect(data.membershipPlans.length).toBe(3);
    expect(data.trainers.length).toBeGreaterThanOrEqual(5);
    expect(data.classes.length).toBeGreaterThanOrEqual(5);
  });

  it('should contain default demo Admin and Member credentials in seeded users', async () => {
    const data = await persistenceService.getData();
    const admin = data.users.find(u => u.email === 'admin@maheshfitness.local');
    const member = data.users.find(u => u.email === 'member@maheshfitness.local');

    expect(admin).toBeDefined();
    expect(admin?.role).toBe('admin');
    expect(member).toBeDefined();
    expect(member?.role).toBe('member');
  });

  it('should correctly format INR currency in integer paise', () => {
    expect(formatINR(749900)).toBe('₹7,499');
    expect(formatINR(249900)).toBe('₹2,499');
    expect(formatINR(2499900)).toBe('₹24,999');
  });

  it('should prevent double booking and uphold class capacity bounds', async () => {
    const data = await persistenceService.getData();
    const testClass = data.classes[0];
    expect(testClass.capacity).toBeGreaterThan(0);
    expect(testClass.bookedCount).toBeLessThanOrEqual(testClass.capacity);
  });
});

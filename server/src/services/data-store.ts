import { PrismaStore } from './prisma-store';
import { store as inMemoryStore } from './store';

export const dataStore = process.env.DATA_STORE === 'prisma' ? new PrismaStore() : inMemoryStore;

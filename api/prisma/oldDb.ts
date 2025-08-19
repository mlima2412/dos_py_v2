import { PrismaClient } from '@prisma/client';

export const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LEGACY_DATABASE_URL, // banco A (origem)
    },
  },
});
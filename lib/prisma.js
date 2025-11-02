import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  if (!databaseUrl.startsWith('postgresql:')) {
    throw new Error('Only PostgreSQL databases are supported. DATABASE_URL must start with "postgresql:"');
  }

  const poolSettings = process.env.NODE_ENV === 'production' 
    ? 'connection_limit=20&pool_timeout=30'
    : 'connection_limit=15&pool_timeout=20';

  const separator = databaseUrl.includes('?') ? '&' : '?';
  const finalDatabaseUrl = `${databaseUrl}${separator}${poolSettings}`;

  const prismaConfig = {
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: finalDatabaseUrl
      },
    },
  };

  return new PrismaClient(prismaConfig);
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
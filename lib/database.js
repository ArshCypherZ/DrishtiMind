import { PrismaClient } from '@prisma/client';

export const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!databaseUrl.startsWith('postgresql:')) {
    throw new Error('Only PostgreSQL databases are supported. DATABASE_URL must start with "postgresql:"');
  }

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    url: databaseUrl,
    provider: 'postgresql',
    isProduction,
    directUrl: process.env.DIRECT_URL || databaseUrl,
  };
};

export const createDatabaseUrl = (config) => {
  const { host, port, database, username, password, schema = 'public' } = config;
  return `postgresql://${username}:${password}@${host}:${port}/${database}?schema=${schema}`;
};

export const validateDatabaseConnection = async () => {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: `Database connection failed: ${error.message}` 
    };
  }
};

export const getMigrationCommands = () => {
  return {
    generate: 'npx prisma generate',
    migrate: 'npx prisma migrate deploy',
    reset: 'npx prisma migrate reset --force',
    status: 'npx prisma migrate status',
  };
};

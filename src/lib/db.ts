import 'server-only';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("DATABASE_URL or DIRECT_URL is not defined in production");
    }
}

// Refined pool for serverless environments
const pool = new Pool({
    connectionString,
    max: 10,               // Limit total connections per function instance
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // 5s timeout to fail fast
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

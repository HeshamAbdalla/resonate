import 'server-only';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
    let connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.NETLIFY_DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL, DIRECT_URL, or NETLIFY_DATABASE_URL is missing from environment variables.");
        if (process.env.NODE_ENV === 'production') {
            throw new Error("DATABASE_URL, DIRECT_URL, or NETLIFY_DATABASE_URL is not defined in production. Check Netlify Environment Variables.");
        }
    } else {
        // Remove problematic Neon-specific parameters
        connectionString = connectionString
            .replace(/[?&]channel_binding=require/g, '')
            .replace(/-pooler\.([^/]+)\.neon\.tech/g, '.$1.neon.tech')
            .replace(/\?&/g, '?')
            .replace(/[?&]$/g, '');

        const maskedUrl = connectionString.replace(/\/\/.*:.*@/, "//***:***@");
        console.log(`📡 Prisma initialized with: ${maskedUrl}`);
    }

    // Use standard pg adapter with connection pooling for serverless
    const pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);

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

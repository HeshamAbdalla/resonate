import 'server-only';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL or DIRECT_URL is missing from environment variables.");
        if (process.env.NODE_ENV === 'production') {
            throw new Error("DATABASE_URL or DIRECT_URL is not defined in production. Check Netlify Environment Variables.");
        }
    } else {
        const maskedUrl = connectionString.replace(/\/\/.*:.*@/, "//***:***@");
        console.log(`📡 Prisma initialized with: ${maskedUrl}`);
    }

    // Use the Neon serverless Pool for runtime
    // Note: Node.js 20+ has global WebSocket support
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool as any);

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

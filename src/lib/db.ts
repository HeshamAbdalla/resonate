import 'server-only';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const prismaClientSingleton = () => {
    let connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || process.env.NETLIFY_DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL, DIRECT_URL, or NETLIFY_DATABASE_URL is missing from environment variables.");
        if (process.env.NODE_ENV === 'production') {
            throw new Error("DATABASE_URL, DIRECT_URL, or NETLIFY_DATABASE_URL is not defined in production. Check Netlify Environment Variables.");
        }
    } else {
        // Remove channel_binding parameter - it causes the Neon adapter to fail with "localhost" error
        // This is a known issue with @neondatabase/serverless driver's connection string parser
        connectionString = connectionString.replace(/[?&]channel_binding=require/g, '');

        // Remove -pooler from hostname - the Neon serverless driver has its own pooling over WebSockets
        // Using Neon's pooler endpoint conflicts with the driver's connection mechanism
        connectionString = connectionString.replace(/-pooler\.([^/]+)\.neon\.tech/g, '.$1.neon.tech');

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

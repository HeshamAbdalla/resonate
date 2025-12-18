import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // Clean up existing data
    console.log('🧹 Cleaning up existing data...');
    await prisma.commentVote.deleteMany();
    await prisma.postVote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.community.deleteMany();
    // Don't delete users as they're created by auth trigger

    // Get or create a test user
    let testUser = await prisma.user.findFirst();
    if (!testUser) {
        console.log('⚠️ No users found. Please sign up first, then run seed again.');
        return;
    }
    console.log(`👤 Using user: ${testUser.username}`);

    // Create Communities
    console.log('🏘️ Creating communities...');
    const communities = await Promise.all([
        prisma.community.create({
            data: {
                name: 'Future Technology',
                slug: 'FutureTech',
                description: 'A community dedicated to discussion of emerging technologies, futurology, and the singularity. We focus on scientific breakthroughs, not just consumer gadgets.',
                creatorId: testUser.id,
            },
        }),
        prisma.community.create({
            data: {
                name: 'Philosophy',
                slug: 'Philosophy',
                description: 'The dedicated subreddit for the discussion of philosophical topics, from ethics and metaphysics to logic and political theory.',
                creatorId: testUser.id,
            },
        }),
        prisma.community.create({
            data: {
                name: 'Digital Art',
                slug: 'DigitalArt',
                description: 'Showcasing the best in digital painting, 3D modeling, and generative art.',
                creatorId: testUser.id,
            },
        }),
        prisma.community.create({
            data: {
                name: 'Urban Planning',
                slug: 'UrbanPlanning',
                description: 'Discussions about city design, public transit, walkability, and building better communities.',
                creatorId: testUser.id,
            },
        }),
        prisma.community.create({
            data: {
                name: 'Sustainable Living',
                slug: 'SustainableLiving',
                description: 'Tips, discussions, and inspiration for living a more sustainable lifestyle.',
                creatorId: testUser.id,
            },
        }),
    ]);

    console.log(`✅ Created ${communities.length} communities`);

    // Create Posts
    console.log('📝 Creating posts...');
    const posts = await Promise.all([
        // FutureTech posts
        prisma.post.create({
            data: {
                title: 'We finally achieved reliable fusion power in the lab. Here is why it changes everything.',
                content: 'After decades of "always being 20 years away", the recent breakthrough at NIF has actually been replicated three times with increasing net energy gain. I\'ve broken down the physics into simple terms...',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[0].id,
                upvotes: 14200,
                score: 14200,
            },
        }),
        prisma.post.create({
            data: {
                title: 'The new solid-state battery prototype just hit 800 miles range.',
                content: 'This is a massive leap forward. Previous iterations struggled with dendrite formation, but the new ceramic electrolyte solves it...',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[0].id,
                upvotes: 428,
                score: 428,
            },
        }),
        prisma.post.create({
            data: {
                title: 'Are we ignoring the privacy implications of neural interfaces?',
                content: 'As brain-computer interfaces become more sophisticated, we need to have serious conversations about mental privacy...',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[0].id,
                upvotes: 1200,
                score: 1200,
            },
        }),

        // Philosophy posts
        prisma.post.create({
            data: {
                title: 'Is "Resonance" just another form of social echo chamber?',
                content: 'By grouping users based on "Insight Scores", are we creating an aristocracy of thought rather than a democracy?',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[1].id,
                upvotes: 2800,
                score: 2800,
            },
        }),
        prisma.post.create({
            data: {
                title: 'Camus and the Absurdity of finding "hidden gems" in an infinite feed.',
                content: 'One must imagine Sisyphus scrolling.',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[1].id,
                upvotes: 940,
                score: 940,
            },
        }),

        // Digital Art posts
        prisma.post.create({
            data: {
                title: 'My latest landscape heavily inspired by Resonate\'s UI aesthetics. WDYT?',
                content: 'I wanted to capture that deep obsidian, neon-soaked vibe. Created in Blender 4.0 using the new Eevee Next engine.',
                type: 'image',
                authorId: testUser.id,
                communityId: communities[2].id,
                upvotes: 2100,
                score: 2100,
            },
        }),
        prisma.post.create({
            data: {
                title: 'Neon Skies - Made with Blender Eevee',
                content: 'Spent way too long on the volumetrics but I think it was worth it.',
                type: 'image',
                authorId: testUser.id,
                communityId: communities[2].id,
                upvotes: 3400,
                score: 3400,
            },
        }),

        // Urban Planning posts
        prisma.post.create({
            data: {
                title: 'Cars shouldn\'t be banned, but they should be guests in cities.',
                content: 'The concept of "shared space" works wonders in removing traffic lights and signs, forcing drivers to make eye contact with pedestrians. It turns the street back into a public realm...',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[3].id,
                upvotes: 4800,
                score: 4800,
            },
        }),

        // Sustainable Living posts
        prisma.post.create({
            data: {
                title: 'Local library waives all late fees, sees 400% increase in returned books.',
                content: 'It turns out shame was the biggest barrier. People just wanted to read.',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[4].id,
                upvotes: 42500,
                score: 42500,
            },
        }),
        prisma.post.create({
            data: {
                title: 'New study links moderate coffee consumption to increased longevity.',
                content: 'A meta-analysis of 30 studies suggests that 2-3 cups a day provides optimal benefits.',
                type: 'text',
                authorId: testUser.id,
                communityId: communities[4].id,
                upvotes: 18200,
                score: 18200,
            },
        }),
    ]);

    console.log(`✅ Created ${posts.length} posts`);

    // Create some comments
    console.log('💬 Creating comments...');
    const comments = await Promise.all([
        prisma.comment.create({
            data: {
                content: 'This is incredible! The implications for clean energy are massive.',
                authorId: testUser.id,
                postId: posts[0].id,
                upvotes: 342,
                score: 342,
            },
        }),
        prisma.comment.create({
            data: {
                content: 'I\'ve been following this for years. Finally some real progress!',
                authorId: testUser.id,
                postId: posts[0].id,
                upvotes: 128,
                score: 128,
            },
        }),
        prisma.comment.create({
            data: {
                content: 'The philosophy angle here is really interesting. Great post!',
                authorId: testUser.id,
                postId: posts[3].id,
                upvotes: 89,
                score: 89,
            },
        }),
    ]);

    console.log(`✅ Created ${comments.length} comments`);

    // Subscribe user to communities
    console.log('🔔 Creating subscriptions...');
    await Promise.all(
        communities.map(community =>
            prisma.subscription.create({
                data: {
                    userId: testUser!.id,
                    communityId: community.id,
                },
            })
        )
    );

    console.log('✅ Created subscriptions');

    console.log('\n🎉 Seed completed successfully!');
    console.log(`
Summary:
- ${communities.length} communities
- ${posts.length} posts
- ${comments.length} comments
- User subscribed to all communities
    `);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

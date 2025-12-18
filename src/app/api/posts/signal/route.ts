export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface SignalPost {
    id: string;
    title: string;
    content: string | null;
    createdAt: Date;
    score: number;
    signalScore: number;
    signalReasons: string[];
    author: {
        id: string;
        username: string;
        image: string | null;
    };
    community: {
        id: string;
        slug: string;
        name: string;
    };
    _count: {
        comments: number;
    };
    // Signal-specific metrics
    uniqueVoices: number;
    replyDepth: number;
    conversationVelocity: number;
    hasCreatorReply: boolean;
    recentParticipants: {
        id: string;
        username: string;
        image: string | null;
    }[];
    previewReplies: {
        author: string;
        content: string;
    }[];
    isDeepThread: boolean;
    isFeatured: boolean;
    // Live-specific fields
    isLive: boolean;
    lastActivityAt: Date | null;
    liveScore: number;
    repliesInLast30Min: number;
    repliesInLast2Hours: number;
}

// Calculate hours since a date
function hoursSince(date: Date): number {
    return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

// Calculate minutes since a date
function minutesSince(date: Date): number {
    return (Date.now() - date.getTime()) / (1000 * 60);
}

// GET - Fetch Signal Feed with conversation-aware ranking
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const filter = searchParams.get('filter') || 'hot'; // hot, rising, deep, live

        // Adjust time window based on filter
        // For LIVE filter, we need to look at older posts too because a post from a week ago
        // can still be "live" if someone commented on it recently
        const timeWindowDays = filter === 'live' ? 30 : 7; // Live looks at last 30 days

        // Get posts with comment counts
        const posts = await prisma.post.findMany({
            take: filter === 'live' ? 200 : 50, // Fetch more for live to find active ones
            orderBy: { createdAt: 'desc' },
            where: {
                createdAt: {
                    gte: new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000),
                },
            },
            include: {
                author: {
                    select: { id: true, username: true, image: true },
                },
                community: {
                    select: { id: true, slug: true, name: true, creatorId: true },
                },
                comments: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        authorId: true,
                        author: {
                            select: { id: true, username: true, image: true },
                        },
                        parentId: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100, // Get recent comments for analysis
                },
                _count: {
                    select: { comments: true },
                },
            },
        });

        // Calculate Signal Score for each post
        const signalPosts: SignalPost[] = posts.map((post: any) => {
            const hoursOld = hoursSince(post.createdAt);
            const comments = post.comments;

            // 1. Unique voices (distinct commenters)
            const uniqueVoices = new Set(comments.map((c: any) => c.authorId)).size;

            // 2. Reply depth (nested replies indicate discussion)
            const repliesWithParent = comments.filter((c: any) => c.parentId !== null).length;
            const replyDepth = comments.length > 0 ? (repliesWithParent / comments.length) : 0;

            // 3. Conversation velocity - multiple time windows for "live" detection
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            const repliesInLast30Min = comments.filter((c: any) => c.createdAt >= thirtyMinutesAgo).length;
            const repliesInLast2Hours = comments.filter((c: any) => c.createdAt >= twoHoursAgo).length;
            const conversationVelocity = repliesInLast2Hours;

            // 4. Last activity timestamp
            const lastActivityAt = comments.length > 0 ? comments[0].createdAt : null;
            const minutesSinceLastActivity = lastActivityAt ? minutesSince(lastActivityAt) : Infinity;

            // 5. Is this conversation "live"?
            // Live = at least 1 reply in last 30 min OR 3+ replies in last 2 hours
            const isLive = repliesInLast30Min >= 1 || repliesInLast2Hours >= 3;

            // 6. Creator participation
            const creatorIds = [post.community.creatorId, post.author.id];
            const creatorReplies = comments.filter((c: any) => creatorIds.includes(c.authorId)).length;
            const hasCreatorReply = creatorReplies > 0;

            // 7. Substance score (average reply length)
            const avgReplyLength = comments.length > 0
                ? comments.reduce((sum: number, c: any) => sum + c.content.length, 0) / comments.length
                : 0;

            // Calculate Signal Score
            let signalScore = post.score; // Base score (upvotes - downvotes)

            // Add conversation depth bonus
            signalScore += replyDepth * 1.5 * 10;

            // Add unique voices bonus (capped)
            signalScore += Math.min(uniqueVoices, 50) * 2;

            // Add conversation velocity bonus
            signalScore += conversationVelocity * 1.4 * 5;

            // Add creator participation bonus (CAPPED at 25% of base)
            const maxCreatorBoost = Math.max(signalScore * 0.25, 10);
            const creatorBoost = Math.min(creatorReplies * 3, maxCreatorBoost);
            signalScore += creatorBoost;

            // Substance bonus for longer replies
            if (avgReplyLength > 100) signalScore *= 1.1;

            // Discussion over reactions bonus
            if (post._count.comments > post.score && post._count.comments > 5) {
                signalScore *= 1.2;
            }

            // Time decay
            signalScore = signalScore / Math.pow(hoursOld + 2, 1.5);

            // LIVE SCORE - Special scoring for Live feed
            // Heavily weights recency and velocity
            let liveScore = 0;
            liveScore += repliesInLast30Min * 10; // Massive boost for very recent replies
            liveScore += repliesInLast2Hours * 3;  // Good boost for recent replies
            liveScore += uniqueVoices * 2;          // Diversity matters
            // Penalize if last activity was a while ago
            if (minutesSinceLastActivity < 10) liveScore *= 2;    // Super hot
            else if (minutesSinceLastActivity < 30) liveScore *= 1.5; // Hot
            else if (minutesSinceLastActivity < 60) liveScore *= 1.2; // Warm
            else if (minutesSinceLastActivity > 120) liveScore *= 0.5; // Cooling

            // Build signal reasons for transparency
            const signalReasons: string[] = [];
            if (uniqueVoices >= 5) signalReasons.push(`${uniqueVoices} people are participating`);
            if (replyDepth > 0.3) signalReasons.push('Replies outnumber top-level comments');
            if (repliesInLast30Min >= 2) signalReasons.push('Very active right now');
            else if (conversationVelocity >= 3) signalReasons.push('Active in the last 2 hours');
            if (hasCreatorReply) signalReasons.push('Creator is participating');
            if (avgReplyLength > 100) signalReasons.push('In-depth responses');

            // Get recent participants for avatar display (up To 5)
            const seenUsers = new Set<string>();
            const recentParticipants = comments
                .filter((c: any) => {
                    if (seenUsers.has(c.authorId)) return false;
                    seenUsers.add(c.authorId);
                    return true;
                })
                .slice(0, 5)
                .map((c: any) => ({
                    id: c.author.id,
                    username: c.author.username,
                    image: c.author.image,
                }));

            // Get preview replies (2-3 conversational snippets)
            const previewReplies = comments
                .slice(0, 3)
                .map((c: any) => ({
                    author: c.author.username,
                    content: c.content.length > 80 ? c.content.slice(0, 80) + '...' : c.content,
                }));

            // Determine if deep thread (high reply depth + many voices)
            const isDeepThread = replyDepth > 0.4 && uniqueVoices >= 5;

            return {
                id: post.id,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt,
                score: post.score,
                signalScore,
                signalReasons,
                author: post.author,
                community: {
                    id: post.community.id,
                    slug: post.community.slug,
                    name: post.community.name,
                },
                _count: post._count,
                uniqueVoices,
                replyDepth,
                conversationVelocity,
                hasCreatorReply,
                recentParticipants,
                previewReplies,
                isDeepThread,
                isFeatured: false,
                // Live fields
                isLive,
                lastActivityAt,
                liveScore,
                repliesInLast30Min,
                repliesInLast2Hours,
            };
        });

        // Sort by signal score
        signalPosts.sort((a, b) => b.signalScore - a.signalScore);

        // Apply filter
        let filteredPosts = signalPosts;
        if (filter === 'live') {
            // LIVE filter: Only show truly active conversations
            filteredPosts = signalPosts
                .filter((p: any) => p.isLive) // Must be live
                .sort((a, b) => b.liveScore - a.liveScore); // Sort by live score
        } else if (filter === 'rising') {
            filteredPosts = signalPosts
                .filter((p: any) => p.conversationVelocity >= 2)
                .sort((a, b) => b.conversationVelocity - a.conversationVelocity);
        } else if (filter === 'deep') {
            filteredPosts = signalPosts
                .filter((p: any) => p.isDeepThread)
                .sort((a, b) => (b.uniqueVoices + b.replyDepth * 10) - (a.uniqueVoices + a.replyDepth * 10));
        }

        // Paginate
        const paginatedPosts = filteredPosts.slice(offset, offset + limit);

        // Serialize dates
        const serialized = paginatedPosts.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            lastActivityAt: p.lastActivityAt?.toISOString() || null,
        }));

        return NextResponse.json({
            posts: serialized,
            total: filteredPosts.length,
            hasMore: offset + limit < filteredPosts.length,
            filter,
            liveCount: signalPosts.filter(p => p.isLive).length, // Number of live conversations
        });
    } catch (error) {
        console.error('Error fetching signal feed:', error);
        return NextResponse.json({ error: 'Failed to fetch signal feed' }, { status: 500 });
    }
}


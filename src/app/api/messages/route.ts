import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - List user's DM conversations
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all conversations where user is a participant
        const participants = await prisma.conversationParticipant.findMany({
            where: { userId: user.id },
            include: {
                conversation: {
                    include: {
                        participants: true,
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { conversation: { updatedAt: 'desc' } },
        });

        // Get other participants' user info
        const otherUserIds = participants.flatMap((p: any) =>
            p.conversation.participants
                .filter((part: any) => part.userId !== user.id)
                .map((part: any) => part.userId)
        );

        const users = await prisma.user.findMany({
            where: { id: { in: otherUserIds } },
            select: { id: true, username: true, image: true, name: true },
        });

        const userMap = new Map(users.map((u: any) => [u.id, u]));

        const conversations = participants.map((p: any) => {
            const otherParticipants = p.conversation.participants
                .filter((part: any) => part.userId !== user.id)
                .map((part: any) => {
                    const u = userMap.get(part.userId);
                    return {
                        id: part.userId,
                        username: u?.username || 'Unknown',
                        name: u?.name,
                        image: u?.image,
                    };
                });

            const lastMessage = p.conversation.messages[0];

            return {
                id: p.conversation.id,
                participants: otherParticipants,
                lastMessage: lastMessage ? {
                    content: lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
                    createdAt: lastMessage.createdAt.toISOString(),
                } : null,
                updatedAt: p.conversation.updatedAt.toISOString(),
                unreadCount: 0, // TODO: implement unread tracking
            };
        });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

// POST - Create a new conversation or get existing
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipientId } = await request.json();

        if (!recipientId) {
            return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
        }

        // Check if recipient exists
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true, username: true },
        });

        if (!recipient) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check for existing conversation between these users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: user.id } } },
                    { participants: { some: { userId: recipientId } } },
                ],
                participants: { every: { userId: { in: [user.id, recipientId] } } },
            },
            include: {
                participants: {
                    where: { userId: { not: user.id } },
                },
            },
        });

        if (existingConversation) {
            return NextResponse.json({
                id: existingConversation.id,
                isNew: false,
            });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: user.id },
                        { userId: recipientId },
                    ],
                },
            },
        });

        return NextResponse.json({
            id: conversation.id,
            isNew: true,
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        // Check user is participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Get messages
        const messages = await prisma.chatMessage.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });

        // Get sender info
        const senderIds = [...new Set(messages.map(m => m.senderId))];
        const senders = await prisma.user.findMany({
            where: { id: { in: senderIds } },
            select: { id: true, username: true, image: true },
        });

        const senderMap = new Map(senders.map(s => [s.id, s]));

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt.toISOString(),
            user: {
                id: msg.senderId,
                name: senderMap.get(msg.senderId)?.username || 'Unknown',
                image: senderMap.get(msg.senderId)?.image || null,
            },
        }));

        // Update last read
        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
            data: { lastReadAt: new Date() },
        });

        return NextResponse.json({ messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching DM messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST - Send message to conversation
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Check user is participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Create message
        const message = await prisma.chatMessage.create({
            data: {
                content: content.trim(),
                senderId: user.id,
                roomType: 'dm',
                roomId: id,
                conversationId: id,
            },
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({
            message: {
                id: message.id,
                content: message.content,
                senderId: message.senderId,
                createdAt: message.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error sending DM:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

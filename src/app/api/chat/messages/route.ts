import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - Fetch messages for a room
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const room = searchParams.get('room');
        const roomType = searchParams.get('roomType') || 'community';
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!room) {
            return NextResponse.json({ error: 'Room is required' }, { status: 400 });
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                roomType,
                roomId: room,
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });

        // Get sender info for each message
        const senderIds = [...new Set(messages.map((m: any) => m.senderId))];
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

        return NextResponse.json({ messages: formattedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST - Save a message
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, roomType, roomId, conversationId } = body;

        if (!content || !roomType || !roomId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                content: content.trim(),
                senderId: user.id,
                roomType,
                roomId,
                conversationId: conversationId || null,
            },
        });

        // If DM, update conversation updatedAt
        if (conversationId) {
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });
        }

        return NextResponse.json({
            id: message.id,
            message: 'Message saved',
        });
    } catch (error) {
        console.error('Error saving message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

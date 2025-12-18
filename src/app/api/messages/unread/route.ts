import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - Get unread message count for the current user
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ unreadCount: 0 });
        }

        // Get all conversations the user is part of
        const participants = await prisma.conversationParticipant.findMany({
            where: { userId: user.id },
            select: {
                lastReadAt: true,
                conversationId: true,
            },
        });

        if (participants.length === 0) {
            return NextResponse.json({ unreadCount: 0 });
        }

        // Count messages in each conversation that are newer than lastReadAt
        // and not sent by the current user
        let totalUnread = 0;

        for (const participant of participants) {
            const unreadMessages = await prisma.chatMessage.count({
                where: {
                    conversationId: participant.conversationId,
                    createdAt: { gt: participant.lastReadAt },
                    senderId: { not: user.id },
                },
            });
            totalUnread += unreadMessages;
        }

        return NextResponse.json({ unreadCount: totalUnread });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json({ unreadCount: 0 });
    }
}

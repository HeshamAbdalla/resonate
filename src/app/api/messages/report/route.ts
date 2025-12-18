import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

const VALID_REASONS = ['harassment', 'spam', 'threats', 'hate_speech', 'other'];

// POST - Report a message
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId, reason, description } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
        }

        if (!reason || !VALID_REASONS.includes(reason)) {
            return NextResponse.json({
                error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}`,
            }, { status: 400 });
        }

        // Check if message exists
        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId },
            select: { id: true, senderId: true },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Can't report your own message
        if (message.senderId === user.id) {
            return NextResponse.json({ error: 'You cannot report your own message' }, { status: 400 });
        }

        // Check for existing report
        const existingReport = await prisma.messageReport.findFirst({
            where: {
                reporterId: user.id,
                messageId,
            },
        });

        if (existingReport) {
            return NextResponse.json({ error: 'You have already reported this message' }, { status: 400 });
        }

        // Create report
        const report = await prisma.messageReport.create({
            data: {
                reporterId: user.id,
                messageId,
                reason,
                description,
            },
        });

        return NextResponse.json({
            success: true,
            reportId: report.id,
            message: 'Report submitted successfully. Our team will review it shortly.',
        });
    } catch (error) {
        console.error('Error reporting message:', error);
        return NextResponse.json({ error: 'Failed to report message' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

const VALID_PRIVACY_OPTIONS = ['everyone', 'followers', 'following', 'mutual', 'none'];

// GET - Get message settings
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let settings = await prisma.userMessageSettings.findUnique({
            where: { userId: user.id },
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.userMessageSettings.create({
                data: {
                    userId: user.id,
                    messagePrivacy: 'everyone',
                    showReadReceipts: true,
                },
            });
        }

        return NextResponse.json({
            messagePrivacy: settings.messagePrivacy,
            showReadReceipts: settings.showReadReceipts,
        });
    } catch (error) {
        console.error('Error fetching message settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT - Update message settings
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messagePrivacy, showReadReceipts } = await request.json();

        // Validate privacy option
        if (messagePrivacy && !VALID_PRIVACY_OPTIONS.includes(messagePrivacy)) {
            return NextResponse.json({
                error: `Invalid privacy option. Must be one of: ${VALID_PRIVACY_OPTIONS.join(', ')}`,
            }, { status: 400 });
        }

        const updateData: { messagePrivacy?: string; showReadReceipts?: boolean } = {};
        if (messagePrivacy !== undefined) updateData.messagePrivacy = messagePrivacy;
        if (showReadReceipts !== undefined) updateData.showReadReceipts = showReadReceipts;

        const settings = await prisma.userMessageSettings.upsert({
            where: { userId: user.id },
            update: updateData,
            create: {
                userId: user.id,
                messagePrivacy: messagePrivacy || 'everyone',
                showReadReceipts: showReadReceipts ?? true,
            },
        });

        return NextResponse.json({
            success: true,
            messagePrivacy: settings.messagePrivacy,
            showReadReceipts: settings.showReadReceipts,
        });
    } catch (error) {
        console.error('Error updating message settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

// GET - List all moderators for a community
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: communityId } = await params;

        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                creatorId: true,
                creator: {
                    select: { id: true, username: true, image: true }
                },
                moderators: {
                    include: {
                        user: {
                            select: { id: true, username: true, image: true }
                        },
                        addedBy: {
                            select: { username: true }
                        }
                    },
                    orderBy: { addedAt: 'asc' }
                }
            }
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Format response with creator first, then moderators
        const moderatorList = [
            {
                id: 'creator',
                userId: community.creator.id,
                username: community.creator.username,
                image: community.creator.image,
                role: 'creator',
                addedAt: null,
                addedBy: null,
            },
            ...community.moderators.map((mod: { id: string; user: { id: string; username: string; image: string | null }; role: string; addedAt: Date; addedBy: { username: string }; }) => ({
                id: mod.id,
                userId: mod.user.id,
                username: mod.user.username,
                image: mod.user.image,
                role: mod.role,
                addedAt: mod.addedAt.toISOString(),
                addedBy: mod.addedBy.username,
            }))
        ];

        return NextResponse.json({ moderators: moderatorList });
    } catch (error) {
        console.error('Error fetching moderators:', error);
        return NextResponse.json({ error: 'Failed to fetch moderators' }, { status: 500 });
    }
}

// POST - Add a moderator
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: communityId } = await params;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, role = 'moderator' } = body;

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        if (!['admin', 'moderator'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Get community and check permissions
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                creatorId: true,
                moderators: {
                    where: { userId: user.id },
                    select: { role: true }
                }
            }
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        const isCreator = community.creatorId === user.id;
        const isAdmin = community.moderators.some((m: { role: string }) => m.role === 'admin');

        // Only creator can add admins, admins can add mods
        if (role === 'admin' && !isCreator) {
            return NextResponse.json({ error: 'Only the creator can add admins' }, { status: 403 });
        }

        if (role === 'moderator' && !isCreator && !isAdmin) {
            return NextResponse.json({ error: 'Only creators and admins can add moderators' }, { status: 403 });
        }

        // Find the user to add
        const userToAdd = await prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true }
        });

        if (!userToAdd) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already a moderator
        const existingMod = await prisma.communityModerator.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId: userToAdd.id
                }
            }
        });

        if (existingMod) {
            return NextResponse.json({ error: 'User is already a moderator' }, { status: 400 });
        }

        // Cannot add the creator as a moderator
        if (userToAdd.id === community.creatorId) {
            return NextResponse.json({ error: 'Creator is already the owner' }, { status: 400 });
        }

        // Add the moderator
        const newMod = await prisma.communityModerator.create({
            data: {
                communityId,
                userId: userToAdd.id,
                role,
                addedById: user.id
            },
            include: {
                user: { select: { id: true, username: true, image: true } }
            }
        });

        // Log the action
        await prisma.modAction.create({
            data: {
                communityId,
                moderatorId: user.id,
                action: 'add_moderator',
                targetType: 'user',
                targetId: userToAdd.id,
                reason: `Added ${userToAdd.username} as ${role}`,
                isPublic: true
            }
        });

        return NextResponse.json({
            message: `${userToAdd.username} added as ${role}`,
            moderator: {
                id: newMod.id,
                userId: newMod.user.id,
                username: newMod.user.username,
                image: newMod.user.image,
                role: newMod.role
            }
        });
    } catch (error) {
        console.error('Error adding moderator:', error);
        return NextResponse.json({ error: 'Failed to add moderator' }, { status: 500 });
    }
}

// DELETE - Remove a moderator
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: communityId } = await params;
        const { searchParams } = new URL(request.url);
        const modId = searchParams.get('modId');

        if (!modId) {
            return NextResponse.json({ error: 'Moderator ID required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get community and check permissions
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                creatorId: true,
                moderators: {
                    where: { userId: user.id },
                    select: { role: true }
                }
            }
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Get the moderator to remove
        const modToRemove = await prisma.communityModerator.findUnique({
            where: { id: modId },
            include: { user: { select: { username: true } } }
        });

        if (!modToRemove) {
            return NextResponse.json({ error: 'Moderator not found' }, { status: 404 });
        }

        const isCreator = community.creatorId === user.id;
        const isAdmin = community.moderators.some((m: { role: string }) => m.role === 'admin');

        // Only creator can remove admins
        if (modToRemove.role === 'admin' && !isCreator) {
            return NextResponse.json({ error: 'Only the creator can remove admins' }, { status: 403 });
        }

        // Admins can remove mods, mods cannot remove anyone
        if (modToRemove.role === 'moderator' && !isCreator && !isAdmin) {
            return NextResponse.json({ error: 'You cannot remove this moderator' }, { status: 403 });
        }

        // Remove the moderator
        await prisma.communityModerator.delete({
            where: { id: modId }
        });

        // Log the action
        await prisma.modAction.create({
            data: {
                communityId,
                moderatorId: user.id,
                action: 'remove_moderator',
                targetType: 'user',
                targetId: modToRemove.userId,
                reason: `Removed ${modToRemove.user.username} as ${modToRemove.role}`,
                isPublic: true
            }
        });

        return NextResponse.json({
            message: `${modToRemove.user.username} removed as ${modToRemove.role}`
        });
    } catch (error) {
        console.error('Error removing moderator:', error);
        return NextResponse.json({ error: 'Failed to remove moderator' }, { status: 500 });
    }
}

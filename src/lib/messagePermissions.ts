import prisma from '@/lib/db';

interface CanMessageResult {
    canMessage: boolean;
    reason?: string;
}

/**
 * Check if a user can send messages to another user
 * Takes into account: blocks, privacy settings, and follow status
 */
export async function canUserMessage(
    senderId: string,
    recipientId: string
): Promise<CanMessageResult> {
    // Check if sender is blocked by recipient
    const isBlocked = await prisma.blockedUser.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId: recipientId,
                blockedId: senderId,
            },
        },
    });

    if (isBlocked) {
        return { canMessage: false, reason: 'You cannot message this user' };
    }

    // Check if sender has blocked recipient (mutual block check)
    const hasBlocked = await prisma.blockedUser.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId: senderId,
                blockedId: recipientId,
            },
        },
    });

    if (hasBlocked) {
        return { canMessage: false, reason: 'You have blocked this user' };
    }

    // Get recipient's message privacy settings
    const settings = await prisma.userMessageSettings.findUnique({
        where: { userId: recipientId },
    });

    const privacy = settings?.messagePrivacy || 'everyone';

    // Check based on privacy setting
    if (privacy === 'none') {
        return { canMessage: false, reason: 'This user is not accepting messages' };
    }

    if (privacy === 'everyone') {
        return { canMessage: true };
    }

    // Check follow relationships
    const [senderFollowsRecipient, recipientFollowsSender] = await Promise.all([
        prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: senderId,
                    followingId: recipientId,
                },
            },
        }),
        prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: recipientId,
                    followingId: senderId,
                },
            },
        }),
    ]);

    if (privacy === 'followers' && recipientFollowsSender) {
        return { canMessage: true };
    }

    if (privacy === 'following' && senderFollowsRecipient) {
        return { canMessage: true };
    }

    if (privacy === 'mutual' && senderFollowsRecipient && recipientFollowsSender) {
        return { canMessage: true };
    }

    return { canMessage: false, reason: 'This user has restricted who can message them' };
}

/**
 * Check if a user has blocked another user
 */
export async function isUserBlocked(
    userId: string,
    targetId: string
): Promise<boolean> {
    const block = await prisma.blockedUser.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId: userId,
                blockedId: targetId,
            },
        },
    });
    return !!block;
}

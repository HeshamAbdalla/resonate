import prisma from '@/lib/db';

/**
 * Extract @mentions from text content
 * Returns array of usernames (without the @ symbol)
 */
export function extractMentions(content: string): string[] {
    // Match @username patterns (alphanumeric and underscores, 3-20 chars)
    const mentionRegex = /@([a-zA-Z0-9_]{3,20})\b/g;
    const matches = content.match(mentionRegex) || [];
    // Remove @ and deduplicate
    return [...new Set(matches.map((m: string) => m.slice(1).toLowerCase()))];
}

/**
 * Process mentions in content and create notifications
 */
export async function processMentions({
    content,
    mentionerId,
    sourceType,
    sourceId,
    contextTitle,
}: {
    content: string;
    mentionerId: string;
    sourceType: 'post' | 'comment' | 'message';
    sourceId: string;
    contextTitle?: string;
}): Promise<string[]> {
    const usernames = extractMentions(content);

    if (usernames.length === 0) return [];

    // Find users by username
    const users = await prisma.user.findMany({
        where: {
            username: { in: usernames, mode: 'insensitive' },
            id: { not: mentionerId }, // Don't notify self
        },
        select: { id: true, username: true },
    });

    if (users.length === 0) return [];

    // Get mentioner info for notification
    const mentioner = await prisma.user.findUnique({
        where: { id: mentionerId },
        select: { username: true },
    });

    // Create mentions and notifications
    const mentionedUsernames: string[] = [];

    for (const user of users) {
        try {
            // Create mention record
            await prisma.mention.upsert({
                where: {
                    mentionerId_mentionedId_sourceType_sourceId: {
                        mentionerId,
                        mentionedId: user.id,
                        sourceType,
                        sourceId,
                    },
                },
                update: {},
                create: {
                    mentionerId,
                    mentionedId: user.id,
                    sourceType,
                    sourceId,
                },
            });

            // Create notification
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'mention',
                    title: `@${mentioner?.username || 'Someone'} mentioned you`,
                    body: contextTitle
                        ? `in "${contextTitle.slice(0, 50)}${contextTitle.length > 50 ? '...' : ''}"`
                        : `in a ${sourceType}`,
                    sourceType,
                    sourceId,
                    actorId: mentionerId,
                },
            });

            mentionedUsernames.push(user.username);
        } catch (error) {
            console.error(`Error processing mention for ${user.username}:`, error);
        }
    }

    return mentionedUsernames;
}

/**
 * Render mentions in content as HTML links
 */
export function renderMentions(content: string): string {
    return content.replace(
        /@([a-zA-Z0-9_]{3,20})\b/g,
        '<a href="/u/$1" class="mention text-primary hover:underline">@$1</a>'
    );
}

/**
 * Check if a username is valid (exists in database)
 */
export async function validateMention(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true },
    });
    return !!user;
}

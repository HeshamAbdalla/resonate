import prisma from '@/lib/db';

export type ModRole = 'creator' | 'admin' | 'moderator' | null;

interface ModCheckResult {
    isMod: boolean;
    role: ModRole;
    canAddMods: boolean;
    canAddAdmins: boolean;
    canEditSettings: boolean;
}

/**
 * Check if a user is a moderator of a community and return their permissions
 */
export async function checkModPermissions(
    communityId: string,
    userId: string
): Promise<ModCheckResult> {
    const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: {
            creatorId: true,
            moderators: {
                where: { userId },
                select: { role: true }
            }
        }
    });

    if (!community) {
        return {
            isMod: false,
            role: null,
            canAddMods: false,
            canAddAdmins: false,
            canEditSettings: false
        };
    }

    const isCreator = community.creatorId === userId;
    const modRecord = community.moderators[0];

    if (isCreator) {
        return {
            isMod: true,
            role: 'creator',
            canAddMods: true,
            canAddAdmins: true,
            canEditSettings: true
        };
    }

    if (modRecord?.role === 'admin') {
        return {
            isMod: true,
            role: 'admin',
            canAddMods: true,
            canAddAdmins: false,
            canEditSettings: false
        };
    }

    if (modRecord?.role === 'moderator') {
        return {
            isMod: true,
            role: 'moderator',
            canAddMods: false,
            canAddAdmins: false,
            canEditSettings: false
        };
    }

    return {
        isMod: false,
        role: null,
        canAddMods: false,
        canAddAdmins: false,
        canEditSettings: false
    };
}

/**
 * Simple check if user has any mod powers in a community
 */
export async function isModeratorOf(communityId: string, userId: string): Promise<boolean> {
    const result = await checkModPermissions(communityId, userId);
    return result.isMod;
}

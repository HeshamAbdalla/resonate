'use client';

import { useRealtimePresenceRoom } from '@/hooks/useRealtimePresenceRoom';
import AvatarStack from './AvatarStack';
import { Loader2 } from 'lucide-react';

interface RealtimeAvatarStackProps {
    roomName: string;
    maxAvatars?: number;
    size?: 'sm' | 'md' | 'lg';
    showLoader?: boolean;
}

/**
 * Realtime Avatar Stack - shows live users currently in a room/page
 */
export default function RealtimeAvatarStack({
    roomName,
    maxAvatars = 5,
    size = 'md',
    showLoader = true
}: RealtimeAvatarStackProps) {
    const { users, isConnected } = useRealtimePresenceRoom(roomName);

    // Show loading state while connecting
    if (!isConnected && showLoader) {
        return (
            <div className="flex items-center gap-2 text-base-content/40">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Connecting...</span>
            </div>
        );
    }

    // Don't render if no users (or just show count)
    if (users.length === 0) {
        return (
            <div className="flex items-center gap-2 text-base-content/40">
                <div className="w-2 h-2 bg-success/50 rounded-full" />
                <span className="text-xs">0 online</span>
            </div>
        );
    }

    return (
        <AvatarStack
            users={users}
            maxAvatars={maxAvatars}
            size={size}
        />
    );
}

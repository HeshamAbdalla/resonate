'use client';

import { ChatWidget } from '@/components/Chat/ChatWidget';

interface CommunityChatProps {
    communitySlug: string;
    communityName: string;
}

export default function CommunityChat({ communitySlug, communityName }: CommunityChatProps) {
    return (
        <ChatWidget
            roomName={communitySlug}
            roomLabel={`${communityName} Live Chat`}
        />
    );
}

'use client';

import { useState, useEffect } from 'react';
import InlineJoinBar from '@/components/Community/InlineJoinBar';

interface PostPageClientProps {
    communityId: string;
    communitySlug: string;
    communityName: string;
    children: React.ReactNode;
}

export default function PostPageClient({
    communityId,
    communitySlug,
    communityName,
    children,
}: PostPageClientProps) {
    const [isMember, setIsMember] = useState(true); // Assume member until checked

    useEffect(() => {
        async function checkMembership() {
            try {
                const res = await fetch(`/api/communities/${communityId}/membership`);
                if (res.ok) {
                    const data = await res.json();
                    setIsMember(data.isMember);
                }
            } catch (e) {
                console.error('Failed to check membership:', e);
            }
        }
        checkMembership();
    }, [communityId]);

    const handleJoin = async () => {
        const res = await fetch(`/api/communities/${communityId}/subscribe`, {
            method: 'POST',
        });
        if (res.ok) {
            setIsMember(true);
        }
    };

    return (
        <>
            {children}
            <InlineJoinBar
                communityId={communityId}
                communitySlug={communitySlug}
                communityName={communityName}
                isMember={isMember}
                onJoin={handleJoin}
            />
        </>
    );
}

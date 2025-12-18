'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';

interface FollowConversationButtonProps {
    postId: string;
}

export default function FollowConversationButton({ postId }: FollowConversationButtonProps) {
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch(`/api/posts/${postId}/follow`);
                if (res.ok) {
                    const data = await res.json();
                    setFollowing(data.following);
                }
            } catch (e) {
                console.error('Failed to check follow status:', e);
            } finally {
                setLoading(false);
            }
        }
        checkStatus();
    }, [postId]);

    const handleToggle = async () => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/posts/${postId}/follow`, {
                method: following ? 'DELETE' : 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                setFollowing(data.following);
            }
        } catch (e) {
            console.error('Failed to toggle follow:', e);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <button className="btn btn-ghost btn-sm gap-2" disabled>
                <Loader2 className="w-4 h-4 animate-spin" />
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={updating}
            className={`btn btn-sm gap-2 ${following
                    ? 'btn-primary'
                    : 'btn-ghost hover:btn-primary hover:btn-outline'
                }`}
        >
            <Star className={`w-4 h-4 ${following ? 'fill-current' : ''}`} />
            {updating ? 'Updating...' : following ? 'Following' : 'Follow Conversation'}
        </button>
    );
}

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RealtimeChat } from '@/components/Chat/RealtimeChat';
import type { ChatMessage } from '@/hooks/useRealtimeChat';

interface Participant {
    id: string;
    username: string;
    name?: string;
    image?: string;
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [userId, setUserId] = useState<string | null>(null);
    const [username, setUsername] = useState('');
    const [userImage, setUserImage] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<Participant | null>(null);
    const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            try {
                // Get current user
                const userRes = await fetch('/api/auth/me');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.userId) {
                        setUserId(userData.userId);
                        setUsername(userData.user?.username || 'Anonymous');
                        setUserImage(userData.user?.image || null);
                    } else {
                        router.push('/login');
                        return;
                    }
                }

                // Get conversation messages
                const msgRes = await fetch(`/api/messages/${id}`);
                if (msgRes.ok) {
                    const msgData = await msgRes.json();
                    setInitialMessages(msgData.messages || []);
                }

                // Get conversation info for other user
                const convRes = await fetch('/api/messages');
                if (convRes.ok) {
                    const convData = await convRes.json();
                    const conv = convData.conversations?.find((c: { id: string }) => c.id === id);
                    if (conv?.participants?.[0]) {
                        setOtherUser(conv.participants[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to load conversation:', error);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [id, router]);

    // Save messages to database
    const handleMessage = async (messages: ChatMessage[]) => {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.user.id === userId) {
            try {
                await fetch(`/api/messages/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: latestMessage.content }),
                });
            } catch (error) {
                console.error('Failed to save message:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-base-content/10 bg-base-100">
                <Link href="/messages" className="btn btn-ghost btn-sm btn-square">
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                {otherUser && (
                    <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                            <div className="w-10 h-10 rounded-full bg-primary/20">
                                {otherUser.image ? (
                                    <img src={otherUser.image} alt={otherUser.username} />
                                ) : (
                                    <span>{otherUser.username[0]?.toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 className="font-bold">{otherUser.name || otherUser.username}</h2>
                            <p className="text-xs text-base-content/50">@{otherUser.username}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat */}
            {userId && (
                <RealtimeChat
                    roomName={`dm:${id}`}
                    username={username}
                    userId={userId}
                    userImage={userImage}
                    initialMessages={initialMessages}
                    onMessage={handleMessage}
                    placeholder="Type a message..."
                    className="flex-1"
                />
            )}
        </div>
    );
}

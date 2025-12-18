'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image?: string | null;
    };
}

interface UseRealtimeChatProps {
    roomName: string;
    username: string;
    userId: string;
    userImage?: string | null;
    initialMessages?: ChatMessage[];
    onMessage?: (messages: ChatMessage[]) => void;
}

export function useRealtimeChat({
    roomName,
    username,
    userId,
    userImage,
    initialMessages = [],
    onMessage,
}: UseRealtimeChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Update messages when initialMessages change
    useEffect(() => {
        if (initialMessages.length > 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    useEffect(() => {
        if (!roomName) return;

        const supabase = createClient();

        // Create broadcast channel
        const channel = supabase.channel(`chat:${roomName}`, {
            config: {
                broadcast: { self: true },
            },
        });

        channel.on('broadcast', { event: 'message' }, ({ payload }) => {
            const newMessage = payload as ChatMessage;
            setMessages((prev) => {
                const updated = [...prev, newMessage];
                onMessage?.(updated);
                return updated;
            });
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsConnected(true);
            }
        });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [roomName, onMessage]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || !channelRef.current) return;

            const message: ChatMessage = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                content: content.trim(),
                createdAt: new Date().toISOString(),
                user: {
                    id: userId,
                    name: username,
                    image: userImage,
                },
            };

            await channelRef.current.send({
                type: 'broadcast',
                event: 'message',
                payload: message,
            });
        },
        [userId, username, userImage]
    );

    return {
        messages,
        sendMessage,
        isConnected,
    };
}

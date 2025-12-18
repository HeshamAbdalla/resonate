'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { RealtimeChat } from './RealtimeChat';
import type { ChatMessage } from '@/hooks/useRealtimeChat';

interface ChatWidgetProps {
    roomName: string;
    roomLabel?: string;
}

export function ChatWidget({ roomName, roomLabel }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [userImage, setUserImage] = useState<string | null>(null);
    const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch user info and initial messages
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
                    }
                }

                // Get recent messages
                const msgRes = await fetch(`/api/chat/messages?room=${roomName}&limit=50`);
                if (msgRes.ok) {
                    const msgData = await msgRes.json();
                    setInitialMessages(msgData.messages || []);
                }
            } catch (error) {
                console.error('Failed to init chat:', error);
            } finally {
                setLoading(false);
            }
        }

        if (isOpen) {
            init();
        }
    }, [isOpen, roomName]);

    // Save messages to database
    const handleMessage = async (messages: ChatMessage[]) => {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.user.id === userId) {
            try {
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: latestMessage.content,
                        roomType: 'community',
                        roomId: roomName,
                    }),
                });
            } catch (error) {
                console.error('Failed to save message:', error);
            }
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 btn btn-circle btn-lg shadow-xl ${isOpen ? 'btn-error' : 'btn-primary'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-50 w-80 h-[450px] bg-base-100 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden flex flex-col"
                    >
                        {/* Chat Header */}
                        <div className="bg-primary text-primary-content px-4 py-3">
                            <h3 className="font-bold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                {roomLabel || 'Live Chat'}
                            </h3>
                            <p className="text-xs opacity-80">r/{roomName}</p>
                        </div>

                        {/* Chat Content */}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : !userId ? (
                            <div className="flex-1 flex items-center justify-center p-4 text-center">
                                <div>
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-base-content/30" />
                                    <p className="text-sm text-base-content/60">
                                        Sign in to join the chat
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <RealtimeChat
                                roomName={roomName}
                                username={username}
                                userId={userId}
                                userImage={userImage}
                                initialMessages={initialMessages}
                                onMessage={handleMessage}
                                placeholder="Say something..."
                                className="flex-1"
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

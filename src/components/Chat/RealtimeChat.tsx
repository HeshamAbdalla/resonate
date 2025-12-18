'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Send, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeChat, type ChatMessage } from '@/hooks/useRealtimeChat';
import { useChatScroll } from '@/hooks/useChatScroll';
import { ChatMessageItem } from './ChatMessage';

interface RealtimeChatProps {
    roomName: string;
    username: string;
    userId: string;
    userImage?: string | null;
    initialMessages?: ChatMessage[];
    onMessage?: (messages: ChatMessage[]) => void;
    placeholder?: string;
    className?: string;
}

export function RealtimeChat({
    roomName,
    username,
    userId,
    userImage,
    initialMessages = [],
    onMessage,
    placeholder = "Type a message...",
    className = "",
}: RealtimeChatProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, sendMessage, isConnected } = useRealtimeChat({
        roomName,
        username,
        userId,
        userImage,
        initialMessages,
        onMessage,
    });

    const scrollRef = useChatScroll<HTMLDivElement>([messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        await sendMessage(input);
        setInput('');
        inputRef.current?.focus();
    };

    // Group messages by sender for header display
    const shouldShowHeader = (index: number) => {
        if (index === 0) return true;
        const prevMessage = messages[index - 1];
        const currentMessage = messages[index];
        // Show header if different user or more than 5 minutes apart
        if (prevMessage.user.id !== currentMessage.user.id) return true;
        const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(prevMessage.createdAt).getTime();
        return timeDiff > 5 * 60 * 1000;
    };

    return (
        <div className={`flex flex-col h-full bg-base-100 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-base-content/10">
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Wifi className="w-4 h-4 text-success" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-error animate-pulse" />
                    )}
                    <span className="text-xs text-base-content/60">
                        {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                </div>
                <span className="text-xs text-base-content/40">
                    {messages.length} messages
                </span>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-base-content/40 text-sm">
                        No messages yet. Say hello! 👋
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                            <ChatMessageItem
                                key={message.id}
                                message={message}
                                isOwnMessage={message.user.id === userId}
                                showHeader={shouldShowHeader(index)}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-base-content/10">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        className="input input-bordered flex-1 input-sm"
                        disabled={!isConnected}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || !isConnected}
                        className="btn btn-primary btn-sm btn-square"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

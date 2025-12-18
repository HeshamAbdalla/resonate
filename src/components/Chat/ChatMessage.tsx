'use client';

import { motion } from 'framer-motion';
import type { ChatMessage } from '@/hooks/useRealtimeChat';

interface ChatMessageItemProps {
    message: ChatMessage;
    isOwnMessage: boolean;
    showHeader: boolean;
}

export function ChatMessageItem({ message, isOwnMessage, showHeader }: ChatMessageItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[75%] w-fit flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {showHeader && (
                    <div className={`flex items-center gap-2 text-xs px-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        {message.user.image ? (
                            <img
                                src={message.user.image}
                                alt={message.user.name}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                {message.user.name[0]?.toUpperCase()}
                            </div>
                        )}
                        <span className="font-medium">{message.user.name}</span>
                        <span className="text-base-content/50 text-xs">
                            {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </span>
                    </div>
                )}
                <div
                    className={`py-2 px-3 rounded-2xl text-sm w-fit max-w-full break-words ${isOwnMessage
                            ? 'bg-primary text-primary-content rounded-tr-sm'
                            : 'bg-base-200 text-base-content rounded-tl-sm'
                        }`}
                >
                    {message.content}
                </div>
            </div>
        </motion.div>
    );
}

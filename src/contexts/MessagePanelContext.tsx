'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Conversation {
    id: string;
    participants: {
        id: string;
        username: string;
        name?: string;
        image?: string;
    }[];
}

interface MessagePanelContextType {
    isOpen: boolean;
    activeConversation: Conversation | null;
    openPanel: (conversation: Conversation) => void;
    closePanel: () => void;
}

const MessagePanelContext = createContext<MessagePanelContextType | null>(null);

export function MessagePanelProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

    const openPanel = useCallback((conversation: Conversation) => {
        setActiveConversation(conversation);
        setIsOpen(true);
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
        // Delay clearing conversation for animation
        setTimeout(() => setActiveConversation(null), 300);
    }, []);

    return (
        <MessagePanelContext.Provider value={{ isOpen, activeConversation, openPanel, closePanel }}>
            {children}
        </MessagePanelContext.Provider>
    );
}

export function useMessagePanel() {
    const context = useContext(MessagePanelContext);
    if (!context) {
        throw new Error('useMessagePanel must be used within a MessagePanelProvider');
    }
    return context;
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MoreVertical, ShieldAlert, Ban, Flag, CheckCircle } from 'lucide-react';
import { useMessagePanel } from '@/contexts/MessagePanelContext';

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
}

const REPORT_REASONS = [
    { value: 'harassment', label: 'Harassment' },
    { value: 'spam', label: 'Spam' },
    { value: 'threats', label: 'Threats' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'other', label: 'Other' },
];

export default function MessageSidePanel() {
    const { isOpen, activeConversation, closePanel } = useMessagePanel();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages when conversation opens
    useEffect(() => {
        if (!activeConversation) return;

        let isFirstFetch = true;
        const fetchMessages = async () => {
            if (isFirstFetch) setLoading(true);
            try {
                const res = await fetch(`/api/messages/${activeConversation.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                    setCurrentUserId(data.currentUserId);
                }
            } catch (e) {
                console.error('Error fetching messages:', e);
            } finally {
                if (isFirstFetch) {
                    setLoading(false);
                    isFirstFetch = false;
                }
            }
        };

        fetchMessages();
        // Poll every 15 seconds when panel is open
        const interval = setInterval(fetchMessages, 15000);
        return () => clearInterval(interval);
    }, [activeConversation]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Clear action success after 3 seconds
    useEffect(() => {
        if (actionSuccess) {
            const timer = setTimeout(() => setActionSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionSuccess]);

    const handleSend = async () => {
        if (!newMessage.trim() || !activeConversation || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage('');
        setSending(true);

        const tempMessage: Message = {
            id: 'temp-' + Date.now(),
            content: messageContent,
            senderId: currentUserId || '',
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            const res = await fetch(`/api/messages/${activeConversation.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: messageContent }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => prev.map(m =>
                    m.id === tempMessage.id ? data.message : m
                ));
            }
        } catch (e) {
            console.error('Error sending message:', e);
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        } finally {
            setSending(false);
        }
    };

    const handleBlockUser = async () => {
        if (!activeConversation?.participants[0]?.id || actionLoading) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/user/blocked', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: activeConversation.participants[0].id }),
            });

            if (res.ok) {
                setActionSuccess('User blocked successfully');
                setShowMenu(false);
                setTimeout(() => closePanel(), 1500);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to block user');
            }
        } catch (e) {
            console.error('Error blocking user:', e);
            alert('Failed to block user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportMessage = async () => {
        if (!selectedMessageId || !reportReason || actionLoading) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/messages/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: selectedMessageId,
                    reason: reportReason,
                    description: reportDescription,
                }),
            });

            if (res.ok) {
                setActionSuccess('Report submitted. Thank you.');
                setShowReportModal(false);
                setSelectedMessageId(null);
                setReportReason('');
                setReportDescription('');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to submit report');
            }
        } catch (e) {
            console.error('Error reporting message:', e);
            alert('Failed to submit report');
        } finally {
            setActionLoading(false);
        }
    };

    const openReportModal = (messageId: string) => {
        setSelectedMessageId(messageId);
        setShowReportModal(true);
        setShowMenu(false);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const participant = activeConversation?.participants[0];

    return (
        <AnimatePresence>
            {isOpen && activeConversation && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={closePanel}
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-2xl z-50 flex flex-col border-l border-base-content/10"
                    >
                        {/* Success Toast */}
                        <AnimatePresence>
                            {actionSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute top-4 left-4 right-4 bg-success text-success-content px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg z-50"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">{actionSuccess}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-base-content/10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center overflow-hidden">
                                {participant?.image ? (
                                    <img src={participant.image} alt={participant.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary-content font-bold">
                                        {participant?.username?.[0]?.toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate">{participant?.name || participant?.username}</h3>
                                <p className="text-xs text-base-content/60 truncate">@{participant?.username}</p>
                            </div>

                            {/* Safety Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-base-content/10 transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                <AnimatePresence>
                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-base-100 border border-base-content/10 rounded-lg shadow-xl z-20 overflow-hidden"
                                            >
                                                <button
                                                    onClick={handleBlockUser}
                                                    disabled={actionLoading}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-left text-error"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                    <span className="text-sm">Block User</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const lastMessage = messages[messages.length - 1];
                                                        if (lastMessage && lastMessage.senderId !== currentUserId) {
                                                            openReportModal(lastMessage.id);
                                                        } else {
                                                            alert('Select a message from the other user to report');
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-left border-t border-base-content/5"
                                                >
                                                    <ShieldAlert className="w-4 h-4" />
                                                    <span className="text-sm">Report Conversation</span>
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button
                                onClick={closePanel}
                                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-base-content/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-base-content/50 py-8">
                                    <p>No messages yet</p>
                                    <p className="text-sm">Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isOwn = msg.senderId === currentUserId;
                                    return (
                                        <motion.div
                                            key={`${msg.id}-${index}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                                        >
                                            <div className="relative">
                                                <div
                                                    className={`max-w-[80%] px-3 py-2 rounded-2xl ${isOwn
                                                        ? 'bg-primary text-primary-content rounded-br-md'
                                                        : 'bg-base-200 rounded-bl-md'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                                {/* Report button on hover for received messages */}
                                                {!isOwn && (
                                                    <button
                                                        onClick={() => openReportModal(msg.id)}
                                                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-base-200"
                                                        title="Report message"
                                                    >
                                                        <Flag className="w-3 h-3 text-base-content/50" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-base-content/10">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Type a message..."
                                    className="input input-bordered flex-1 h-10 text-sm"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!newMessage.trim() || sending}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Report Modal */}
                    <AnimatePresence>
                        {showReportModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                                onClick={() => setShowReportModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-base-100 rounded-xl shadow-2xl w-full max-w-md p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                                            <Flag className="w-5 h-5 text-error" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Report Message</h3>
                                            <p className="text-xs text-base-content/60">Help us keep the community safe</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Reason</label>
                                            <div className="space-y-2">
                                                {REPORT_REASONS.map((reason) => (
                                                    <label
                                                        key={reason.value}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${reportReason === reason.value
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-base-content/10 hover:bg-base-200'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="reason"
                                                            value={reason.value}
                                                            checked={reportReason === reason.value}
                                                            onChange={(e) => setReportReason(e.target.value)}
                                                            className="radio radio-primary radio-sm"
                                                        />
                                                        <span className="text-sm">{reason.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Additional details (optional)</label>
                                            <textarea
                                                value={reportDescription}
                                                onChange={(e) => setReportDescription(e.target.value)}
                                                placeholder="Provide any additional context..."
                                                className="textarea textarea-bordered w-full h-20 text-sm"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => setShowReportModal(false)}
                                                className="flex-1 btn btn-ghost"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleReportMessage}
                                                disabled={!reportReason || actionLoading}
                                                className="flex-1 btn btn-error"
                                            >
                                                {actionLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Submit Report'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}

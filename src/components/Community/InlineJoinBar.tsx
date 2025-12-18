'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InlineJoinBarProps {
    communityName: string;
    communitySlug: string;
    communityId: string;
    isMember: boolean;
    onJoin: () => Promise<void>;
}

export default function InlineJoinBar({
    communityName,
    communitySlug,
    communityId,
    isMember,
    onJoin,
}: InlineJoinBarProps) {
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(isMember);
    const [dismissed, setDismissed] = useState(false);

    if (joined || dismissed) return null;

    const handleJoin = async () => {
        setJoining(true);
        try {
            await onJoin();
            setJoined(true);
        } catch (e) {
            console.error('Failed to join:', e);
        } finally {
            setJoining(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-content/10 shadow-lg"
            >
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                This conversation lives in <span className="font-bold text-primary">r/{communitySlug}</span>
                            </p>
                            <p className="text-xs text-base-content/60">
                                Join to participate in the discussion
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className={`btn btn-primary btn-sm ${joining ? 'loading' : ''}`}
                        >
                            {joining ? 'Joining...' : 'Join Community'}
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="btn btn-ghost btn-sm btn-square"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

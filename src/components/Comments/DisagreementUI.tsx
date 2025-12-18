'use client';

import { motion } from 'framer-motion';
import { RefreshCw, MessageCircle } from 'lucide-react';

interface DisagreementBadgeProps {
    isFirstDisagreement?: boolean;
    showNudge?: boolean;
    onReply?: () => void;
    onFollow?: () => void;
}

/**
 * Badge shown on comments that are detected as good-faith disagreements
 * Uses "Different perspective" framing to make disagreement collaborative
 */
export function DisagreementBadge({ isFirstDisagreement = false }: { isFirstDisagreement?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium"
        >
            <RefreshCw className="w-3 h-3" />
            Different perspective
        </motion.div>
    );
}

/**
 * Microcopy shown under a disagreement reply for the first time
 * Reframes disagreement as normal and healthy
 */
export function DisagreementMicrocopy() {
    return (
        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-base-content/50 mt-1 italic"
        >
            Disagreement is part of healthy conversations.
        </motion.p>
    );
}

/**
 * Response nudge shown to the user who received a disagreement
 * Encourages dialogue mode instead of defense mode
 */
export function DisagreementResponseNudge({ onReply, onFollow }: DisagreementBadgeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-3 p-3 bg-base-200/50 rounded-lg border border-base-content/5"
        >
            <div className="flex items-center gap-2 text-sm text-base-content/70 mb-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>🧵 Want to respond? Thoughtful replies keep conversations strong.</span>
            </div>
            <div className="flex gap-2">
                {onReply && (
                    <button onClick={onReply} className="btn btn-sm btn-primary">
                        Reply
                    </button>
                )}
                {onFollow && (
                    <button onClick={onFollow} className="btn btn-sm btn-ghost">
                        Follow conversation
                    </button>
                )}
            </div>
        </motion.div>
    );
}

/**
 * Badge for threads that have developed into healthy debate
 * Shown when back-and-forth is respectful and substantive
 */
export function ThoughtfulDebateBadge() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium"
        >
            🧠 Thoughtful debate
        </motion.div>
    );
}

/**
 * Soft nudge shown when user types aggressive language
 * Non-blocking, preserves autonomy
 */
export function AggressionNudge({ message }: { message: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 bg-warning/10 text-warning text-xs rounded-lg flex items-center gap-2"
        >
            <span>💡</span>
            <span>{message}</span>
        </motion.div>
    );
}

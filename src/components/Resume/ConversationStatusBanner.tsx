'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Coffee, Compass } from 'lucide-react';
import Link from 'next/link';

interface ConversationStatusBannerProps {
    status: 'active' | 'heated' | 'quiet';
    showExploreLink?: boolean;
}

export default function ConversationStatusBanner({
    status,
    showExploreLink = true
}: ConversationStatusBannerProps) {
    if (status === 'active') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-warning"
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                </span>
                <span className="text-sm font-medium">Active discussion</span>
            </motion.div>
        );
    }

    if (status === 'heated') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-error/10 border border-error/20 p-4"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-error" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                            </span>
                            <span className="text-sm font-bold text-error">Heated debate</span>
                        </div>
                        <p className="text-sm text-base-content/70">
                            This discussion is intense. Take your time before responding.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Quiet state
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-base-200/50 border border-base-content/10 p-4"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-base-content/40" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-base-content/40" />
                        <span className="text-sm font-medium text-base-content/60">
                            This conversation is quiet for now
                        </span>
                    </div>
                    {showExploreLink && (
                        <div className="flex items-center gap-2 mt-2">
                            <Link
                                href="/explore"
                                className="btn btn-xs btn-ghost gap-1 text-primary"
                            >
                                <Compass className="w-3.5 h-3.5" />
                                Explore similar conversations
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// No Resumable Conversations State
export function NoResumeState() {
    return (
        <div className="text-center py-8 px-4">
            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8 text-base-content/30" />
            </div>
            <h3 className="text-lg font-medium mb-2">No conversations waiting</h3>
            <p className="text-sm text-base-content/60 mb-4">
                Join discussions and they'll appear here when they're active again!
            </p>
            <Link href="/signal" className="btn btn-primary btn-sm gap-2">
                <Compass className="w-4 h-4" />
                Find conversations
            </Link>
        </div>
    );
}

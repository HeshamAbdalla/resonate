'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, Calendar, User, Shield, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface CommunitySidebarProps {
    communityId: string;
    name: string;
    slug: string;
    description: string | null;
    rules: string | null;
    memberCount: number;
    postCount: number;
    createdAt: Date;
    creatorName: string;
}

// Parse markdown rules into array
function parseRules(rulesMarkdown: string): { number: number; title: string; description: string }[] {
    const lines = rulesMarkdown.split('\n').filter(line => line.trim());
    const rules: { number: number; title: string; description: string }[] = [];

    lines.forEach((line, index) => {
        const match = line.match(/^\d+\.\s*\*?\*?([^*-]+)\*?\*?\s*[-–]?\s*(.*)/);
        if (match) {
            rules.push({
                number: index + 1,
                title: match[1].trim(),
                description: match[2]?.trim() || ''
            });
        } else if (line.trim()) {
            const simpleMatch = line.match(/^\d+\.\s*(.*)/);
            if (simpleMatch) {
                rules.push({
                    number: index + 1,
                    title: simpleMatch[1].trim(),
                    description: ''
                });
            }
        }
    });

    return rules;
}

const defaultRules = [
    { number: 1, title: 'Be Civil', description: 'Attack ideas, not people.' },
    { number: 2, title: 'Stay On Topic', description: 'Posts should be relevant.' },
    { number: 3, title: 'No Spam', description: 'Self-promotion will be removed.' },
];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.3 }
    })
};

export default function CommunitySidebar({
    communityId,
    name,
    slug,
    description,
    rules,
    memberCount,
    postCount,
    createdAt,
    creatorName
}: CommunitySidebarProps) {
    const [showRules, setShowRules] = useState(true);

    const communityRules = rules ? parseRules(rules) : defaultRules;

    return (
        <aside className="flex flex-col gap-4 sticky top-20">
            {/* About Card */}
            <motion.div
                custom={0}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="card bg-base-100 shadow-lg border border-base-content/5"
            >
                <div className="card-body p-5">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        About r/{slug}
                    </h3>

                    {description && (
                        <p className="text-sm text-base-content/70 mb-4">{description}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-base-content/10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="text-2xl font-bold text-primary">{memberCount.toLocaleString()}</div>
                            <div className="text-xs text-base-content/50 flex items-center justify-center gap-1">
                                <Users className="w-3 h-3" /> Members
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <div className="text-2xl font-bold text-secondary">{postCount.toLocaleString()}</div>
                            <div className="text-xs text-base-content/50 flex items-center justify-center gap-1">
                                <FileText className="w-3 h-3" /> Posts
                            </div>
                        </motion.div>
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-2 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-base-content/60">
                            <Calendar className="w-4 h-4" />
                            Created {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-base-content/60">
                            <User className="w-4 h-4" />
                            by <Link href={`/u/${creatorName}`} className="font-medium text-primary hover:underline">u/{creatorName}</Link>
                        </div>
                    </div>

                    {/* Create Post CTA */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href={`/submit?community=${slug}`}
                            className="btn btn-primary w-full mt-4"
                        >
                            Create Post
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Rules Card */}
            <motion.div
                custom={1}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="card bg-base-100 shadow-lg border border-base-content/5"
            >
                <div className="card-body p-5">
                    <button
                        className="flex items-center justify-between w-full"
                        onClick={() => setShowRules(!showRules)}
                    >
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-warning" />
                            Community Rules
                        </h3>
                        <motion.div
                            animate={{ rotate: showRules ? 0 : 180 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronUp className="w-5 h-5 text-base-content/50" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {showRules && communityRules.length > 0 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 space-y-3">
                                    {communityRules.map((rule, index) => (
                                        <motion.div
                                            key={rule.number}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex gap-3"
                                        >
                                            <div className="flex-none w-6 h-6 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold">
                                                {rule.number}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">{rule.title}</h4>
                                                {rule.description && (
                                                    <p className="text-xs text-base-content/50">{rule.description}</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Moderators Card */}
            <motion.div
                custom={2}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="card bg-base-100 shadow-lg border border-base-content/5"
            >
                <div className="card-body p-5">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-base-content/60">
                        <Shield className="w-4 h-4" />
                        Moderators
                    </h3>
                    <Link
                        href={`/u/${creatorName}`}
                        className="flex items-center gap-2 mt-2 hover:bg-base-200 p-2 -mx-2 rounded-lg transition-colors"
                    >
                        <div className="avatar placeholder">
                            <div className="w-8 rounded-full bg-primary text-primary-content">
                                <span className="text-xs">{creatorName[0]?.toUpperCase()}</span>
                            </div>
                        </div>
                        <span className="text-sm font-medium">u/{creatorName}</span>
                        <span className="badge badge-xs badge-primary">Creator</span>
                    </Link>
                </div>
            </motion.div>
        </aside>
    );
}

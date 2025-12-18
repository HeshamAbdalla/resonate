'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, Users, MessageCircle } from 'lucide-react';

interface SignalPost {
    id: string;
    title: string;
    community: { slug: string };
    uniqueVoices: number;
    previewReplies: { author: string; content: string }[];
    isDeepThread: boolean;
    recentParticipants: { id: string; username: string; image: string | null }[];
}

export default function SignalFeedPreview() {
    const [topPost, setTopPost] = useState<SignalPost | null>(null);

    useEffect(() => {
        async function fetchTop() {
            try {
                const res = await fetch('/api/posts/signal?limit=1');
                if (res.ok) {
                    const data = await res.json();
                    if (data.posts?.[0]) {
                        setTopPost(data.posts[0]);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        fetchTop();
    }, []);

    if (!topPost) return null;

    return (
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6 overflow-hidden">
            <div className="card-body p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        Trending Conversation
                    </h3>
                    <Link href="/signal" className="btn btn-ghost btn-xs gap-1">
                        See all <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                <Link href={`/post/${topPost.id}`} className="group">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="badge badge-sm badge-primary">r/{topPost.community.slug}</span>
                        <span className="text-sm text-base-content/70 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span className="font-bold">{topPost.uniqueVoices}</span> voices
                        </span>
                        {topPost.isDeepThread && (
                            <span className="badge badge-xs badge-accent">Deep Thread</span>
                        )}
                    </div>

                    <h4 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {topPost.title}
                    </h4>

                    {topPost.previewReplies.length > 0 && (
                        <div className="bg-base-100/50 rounded-lg p-2 space-y-1">
                            {topPost.previewReplies.slice(0, 2).map((reply, i) => (
                                <p key={i} className="text-sm text-base-content/70 flex items-start gap-2">
                                    <MessageCircle className="w-3 h-3 mt-1 flex-shrink-0" />
                                    <span>
                                        <span className="font-bold">{reply.author}:</span> "{reply.content}"
                                    </span>
                                </p>
                            ))}
                        </div>
                    )}

                    <span className="text-sm font-bold text-primary mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Continue this conversation <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>
            </div>
        </div>
    );
}

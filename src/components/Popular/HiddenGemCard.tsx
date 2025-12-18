import { Gem, ArrowUp, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface GemProps {
    subreddit: string;
    memberCount: string;
    author: string;
    title: string;
    previewText: string;
    score: string;
    commentCount: number;
}

export default function HiddenGemCard({ subreddit, memberCount, author, title, previewText, score, commentCount }: GemProps) {
    return (
        <div className="card bg-base-100 shadow-lg border border-secondary/20 hover:border-secondary/50 transition-all duration-300 group overflow-hidden h-full">
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-150%] group-hover:animate-shine z-0"></div>

            <div className="card-body p-5 relative z-10">
                <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                        <Gem className="w-3 h-3" />
                        <span className="uppercase tracking-wider">Hidden Gem</span>
                    </div>
                    <div className="badge badge-sm badge-ghost text-base-content/40">{memberCount} members</div>
                </div>

                <h3 className="card-title text-base font-bold mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                    {title}
                </h3>

                <p className="text-xs text-base-content/60 mb-4 line-clamp-3">
                    {previewText}
                </p>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-base-content/5">
                    <div className="flex items-center gap-2 text-xs font-bold text-base-content/50">
                        <div className="avatar placeholder">
                            <div className="bg-secondary text-secondary-content rounded-full w-4 h-4">
                                <span className="text-[8px]">{subreddit[2]}</span>
                            </div>
                        </div>
                        {subreddit}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-base-content/50">
                        <span className="flex items-center gap-1 hover:text-base-content cursor-pointer">
                            <ArrowUp className="w-3 h-3" /> {score}
                        </span>
                        <span className="flex items-center gap-1 hover:text-base-content cursor-pointer">
                            <MessageSquare className="w-3 h-3" /> {commentCount}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

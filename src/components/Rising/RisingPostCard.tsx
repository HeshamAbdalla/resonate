import { ArrowUp, MessageSquare, TrendingUp, Zap, Clock, Rocket } from 'lucide-react';
import Link from 'next/link';

interface RisingProps {
    subreddit: string;
    author: string;
    title: string;
    previewText?: string;
    score: string;
    commentCount: number;
    velocity: number; // Comments per hour
    timeSince: string;
    rank: number;
    isGroundFloor?: boolean;
}

export default function RisingPostCard({ subreddit, author, title, previewText, score, commentCount, velocity, timeSince, rank, isGroundFloor }: RisingProps) {

    const getVelocityLabel = (v: number) => {
        if (v > 100) return { label: 'Supersonic', color: 'text-error', bg: 'bg-error/10', icon: Rocket };
        if (v > 50) return { label: 'Surging', color: 'text-warning', bg: 'bg-warning/10', icon: Zap };
        return { label: 'Climbing', color: 'text-success', bg: 'bg-success/10', icon: TrendingUp };
    };

    const metric = getVelocityLabel(velocity);
    const MetricIcon = metric.icon;

    return (
        <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-content/5 group relative overflow-hidden">

            {/* Ground Floor Badge */}
            {isGroundFloor && (
                <div className="absolute top-0 right-0 bg-accent text-accent-content text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 shadow-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Ground Floor
                </div>
            )}

            <div className="card-body p-4 flex flex-row gap-4 items-start">

                {/* Rank Number */}
                <div className="text-2xl font-black text-base-content/10 font-mono w-8 text-center pt-1 group-hover:text-primary/50 transition-colors">
                    {String(rank).padStart(2, '0')}
                </div>

                <div className="flex-1">
                    {/* Meta Header */}
                    <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="font-bold hover:underline cursor-pointer">{subreddit}</span>
                        <span className="text-base-content/40">•</span>
                        <span className="text-base-content/60">Posted by {author}</span>
                        <span className="text-base-content/40">•</span>
                        <span className="text-base-content/60">{timeSince}</span>
                    </div>

                    {/* Title */}
                    <h3 className="card-title text-base font-bold mb-2 group-hover:text-primary transition-colors cursor-pointer">
                        {title}
                    </h3>

                    {previewText && (
                        <p className="text-xs text-base-content/70 line-clamp-2 mb-3">
                            {previewText}
                        </p>
                    )}

                    {/* Metrics Bar */}
                    <div className="flex items-center gap-4 text-xs mt-1">

                        {/* Velocity Indicator */}
                        <div className={`flex items-center gap-1 font-bold px-2 py-1 rounded-full ${metric.bg} ${metric.color}`}>
                            <MetricIcon className="w-3 h-3" />
                            {metric.label} ({velocity}/hr)
                        </div>

                        <div className="flex items-center gap-1 text-base-content/60">
                            <ArrowUp className="w-3 h-3" /> {score}
                        </div>
                        <div className="flex items-center gap-1 text-base-content/60">
                            <MessageSquare className="w-3 h-3" /> {commentCount}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

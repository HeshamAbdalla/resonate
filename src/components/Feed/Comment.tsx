import { ArrowUp, ArrowDown, MessageSquare, MoreHorizontal, ShieldCheck } from 'lucide-react';

interface CommentProps {
    author: string;
    time: string;
    content: string;
    score: string;
    perspective?: 'Constructive' | 'Contrarian' | 'Supportive' | 'Neutral';
    insightScore?: number;
    replies?: CommentProps[];
}

export default function Comment({ author, time, content, score, perspective = 'Neutral', insightScore, replies }: CommentProps) {

    const perspectiveColors = {
        'Constructive': 'border-l-success bg-success/5',
        'Contrarian': 'border-l-warning bg-warning/5',
        'Supportive': 'border-l-info bg-info/5',
        'Neutral': 'border-l-base-content/10'
    };

    const badgeColors = {
        'Constructive': 'badge-success',
        'Contrarian': 'badge-warning',
        'Supportive': 'badge-info',
        'Neutral': 'badge-ghost'
    };

    return (
        <div className={`pl-4 border-l-2 ${perspectiveColors[perspective]} transition-colors duration-200 mt-4 rounded-r-lg p-2`}>
            <div className="flex items-center gap-2 mb-2">
                <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-6">
                        <span className="text-xs">{author[0]}</span>
                    </div>
                </div>
                <span className="font-bold text-sm text-base-content/90">{author}</span>
                <span className="text-xs text-base-content/60">• {time}</span>
                {perspective !== 'Neutral' && (
                    <span className={`badge badge-xs ${badgeColors[perspective]} badge-outline ml-2`}>
                        {perspective}
                    </span>
                )}
                {insightScore && insightScore > 80 && (
                    <span className="badge badge-xs badge-primary badge-outline gap-1" title="High Quality Contributor">
                        <ShieldCheck className="w-2 h-2" /> Top Mind
                    </span>
                )}
            </div>

            <div className="text-sm text-base-content/80 mb-2 leading-relaxed">
                {content}
            </div>

            <div className="flex items-center gap-4 text-xs text-base-content/60">
                <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs btn-square hover:text-secondary">
                        <ArrowUp className="w-3 h-3" />
                    </button>
                    <span className="font-bold">{score}</span>
                    <button className="btn btn-ghost btn-xs btn-square hover:text-error">
                        <ArrowDown className="w-3 h-3" />
                    </button>
                </div>
                <button className="btn btn-ghost btn-xs gap-1">
                    <MessageSquare className="w-3 h-3" /> Reply
                </button>
                <button className="btn btn-ghost btn-xs">Share</button>
                <button className="btn btn-ghost btn-xs btn-square">
                    <MoreHorizontal className="w-3 h-3" />
                </button>
            </div>

            {replies && replies.length > 0 && (
                <div className="ml-2 mt-2">
                    {replies.map((reply, i) => (
                        <Comment key={i} {...reply} />
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, AlertTriangle, FileText, User, Clock } from 'lucide-react';
import Link from 'next/link';

interface ModAction {
    id: string;
    action: string;
    targetType: string | null;
    reason: string | null;
    createdAt: string;
    moderator: {
        username: string;
    };
}

interface ModLogWidgetProps {
    communityId: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    remove_post: <AlertTriangle className="w-4 h-4 text-error" />,
    ban_user: <User className="w-4 h-4 text-error" />,
    warn_user: <AlertTriangle className="w-4 h-4 text-warning" />,
    update_settings: <FileText className="w-4 h-4 text-info" />,
    update_rules: <FileText className="w-4 h-4 text-info" />,
};

const ACTION_LABELS: Record<string, string> = {
    remove_post: 'Removed a post',
    ban_user: 'Banned a user',
    warn_user: 'Warned a user',
    update_settings: 'Updated settings',
    update_rules: 'Updated rules',
};

function formatTimeAgo(dateString: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function ModLogWidget({ communityId }: ModLogWidgetProps) {
    const [actions, setActions] = useState<ModAction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchModLog() {
            try {
                const res = await fetch(`/api/communities/${communityId}/modlog`);
                if (res.ok) {
                    const data = await res.json();
                    setActions(data.actions || []);
                }
            } catch (error) {
                console.error('Failed to fetch mod log:', error);
            }
            setLoading(false);
        }
        fetchModLog();
    }, [communityId]);

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-lg border border-base-content/5 animate-pulse">
                <div className="card-body p-5">
                    <div className="h-4 bg-base-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 bg-base-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-lg border border-base-content/5">
            <div className="card-body p-5">
                <h3 className="font-bold text-sm flex items-center gap-2 text-base-content/80 mb-3">
                    <Eye className="w-4 h-4 text-primary" />
                    Public Mod Log
                    <span className="badge badge-xs badge-primary">Transparent</span>
                </h3>

                {actions.length === 0 ? (
                    <p className="text-sm text-base-content/50 text-center py-4">
                        No mod actions yet. This community is squeaky clean! ✨
                    </p>
                ) : (
                    <div className="space-y-3">
                        {actions.slice(0, 5).map((action) => (
                            <div key={action.id} className="flex items-start gap-3 text-sm">
                                <div className="flex-none mt-0.5">
                                    {ACTION_ICONS[action.action] || <Shield className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-base-content/80">
                                        {ACTION_LABELS[action.action] || action.action}
                                    </p>
                                    {action.reason && (
                                        <p className="text-xs text-base-content/50 truncate">
                                            "{action.reason}"
                                        </p>
                                    )}
                                    <p className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(action.createdAt)} by u/{action.moderator.username}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {actions.length > 5 && (
                    <Link
                        href={`#modlog`}
                        className="text-xs text-primary hover:underline text-center mt-2 block"
                    >
                        View all {actions.length} actions →
                    </Link>
                )}
            </div>
        </div>
    );
}

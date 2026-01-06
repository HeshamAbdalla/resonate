'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import Link from 'next/link';

type Notification = {
    id: string;
    type: 'mention' | 'reply' | 'upvote' | 'follow';
    message: string;
    link: string;
    read: boolean;
    createdAt: string;
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch('/api/user/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/user/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true }),
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/user/notifications/${id}`, {
                method: 'DELETE',
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <div className="flex gap-8 justify-center items-start pt-6">
            <div className="w-full max-w-3xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-2 mb-1">
                            <Bell className="w-8 h-8 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-base-content/60 text-sm">
                            Stay updated on conversations and mentions
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="loading loading-spinner loading-lg"></div>
                        <p className="mt-4">Loading notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`card bg-base-100 shadow-sm border transition-all ${notification.read
                                        ? 'border-base-content/5'
                                        : 'border-primary/30 bg-primary/5'
                                    }`}
                            >
                                <div className="card-body p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <Link
                                                href={notification.link}
                                                className="hover:text-primary transition-colors"
                                            >
                                                <p className="text-sm">{notification.message}</p>
                                                <p className="text-xs text-base-content/50 mt-1">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </p>
                                            </Link>
                                        </div>
                                        <div className="flex gap-1">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="btn btn-ghost btn-sm btn-circle touch-active min-h-[44px] min-w-[44px]"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="btn btn-ghost btn-sm btn-circle touch-active min-h-[44px] min-w-[44px]"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32">
                        <Bell className="w-16 h-16 mx-auto mb-6 text-base-content/30" />
                        <h3 className="text-xl font-bold mb-2 text-base-content/70">
                            No notifications yet
                        </h3>
                        <p className="text-sm text-base-content/50">
                            When someone replies to your posts or mentions you, you'll see it here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

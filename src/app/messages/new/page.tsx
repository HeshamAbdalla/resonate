'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Search, Send, UserCircle } from 'lucide-react';
import Link from 'next/link';

interface User {
    id: string;
    username: string;
    name?: string | null;
    image?: string | null;
}

export default function NewMessagePage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Search users
    useEffect(() => {
        if (!search.trim()) {
            setUsers([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const startConversation = async (userId: string) => {
        setCreating(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientId: userId }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/messages/${data.id}`);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/messages" className="btn btn-ghost btn-sm btn-square">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">New Message</h1>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                    type="text"
                    placeholder="Search for a user to message..."
                    className="input input-bordered w-full pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Results */}
            <div className="card bg-base-100 border border-base-content/10 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-8">
                        <UserCircle className="w-12 h-12 mx-auto mb-3 text-base-content/30" />
                        <p className="text-base-content/60">
                            {search ? 'No users found' : 'Start typing to search for users'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-base-content/5">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => startConversation(user.id)}
                                disabled={creating}
                                className="w-full flex items-center gap-4 p-4 hover:bg-base-200/50 transition-colors text-left"
                            >
                                {/* Avatar */}
                                <div className="avatar placeholder">
                                    <div className="w-12 h-12 rounded-full bg-primary/20">
                                        {user.image ? (
                                            <img src={user.image} alt={user.username} />
                                        ) : (
                                            <span className="text-lg">
                                                {user.username[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="font-bold">{user.name || user.username}</div>
                                    <div className="text-sm text-base-content/50">@{user.username}</div>
                                </div>

                                {/* Action */}
                                <Send className="w-5 h-5 text-primary" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

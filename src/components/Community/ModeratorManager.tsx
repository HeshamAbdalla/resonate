'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, UserPlus, X, Loader2, Crown, ShieldCheck, ShieldAlert, Search, Users } from 'lucide-react';

interface Moderator {
    id: string;
    userId: string;
    username: string;
    image: string | null;
    role: 'creator' | 'admin' | 'moderator';
    addedAt: string | null;
    addedBy: string | null;
}

interface SearchUser {
    id: string;
    username: string;
    image: string | null;
    reputation: number;
}

interface ModeratorManagerProps {
    communityId: string;
    isCreator: boolean;
    isAdmin: boolean;
}

const roleIcons = {
    creator: Crown,
    admin: ShieldCheck,
    moderator: Shield,
};

const roleColors = {
    creator: 'text-warning',
    admin: 'text-primary',
    moderator: 'text-success',
};

export default function ModeratorManager({ communityId, isCreator, isAdmin }: ModeratorManagerProps) {
    const [moderators, setModerators] = useState<Moderator[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [role, setRole] = useState<'admin' | 'moderator'>('moderator');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search/Autocomplete state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [communityMembers, setCommunityMembers] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const canAddMods = isCreator || isAdmin;

    // Fetch moderators
    useEffect(() => {
        fetchModerators();
        fetchCommunityMembers();
    }, [communityId]);

    // Search users with debounce
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/communities/${communityId}/members?q=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.users);
                }
            } catch {
                console.error('Search failed');
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, communityId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchModerators() {
        try {
            const res = await fetch(`/api/communities/${communityId}/moderators`);
            if (res.ok) {
                const data = await res.json();
                setModerators(data.moderators);
            }
        } catch {
            console.error('Failed to fetch moderators');
        } finally {
            setLoading(false);
        }
    }

    async function fetchCommunityMembers() {
        try {
            const res = await fetch(`/api/communities/${communityId}/members`);
            if (res.ok) {
                const data = await res.json();
                setCommunityMembers(data.users);
            }
        } catch {
            console.error('Failed to fetch members');
        }
    }

    function selectUser(user: SearchUser) {
        setSelectedUser(user);
        setSearchQuery(user.username);
        setShowDropdown(false);
    }

    async function handleAdd() {
        if (!selectedUser) {
            setError('Please select a user');
            return;
        }

        setError('');
        setSuccess('');
        setAdding(true);

        try {
            const res = await fetch(`/api/communities/${communityId}/moderators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: selectedUser.username, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to add moderator');
            } else {
                setSuccess(`${selectedUser.username} added as ${role}!`);
                setSelectedUser(null);
                setSearchQuery('');
                setShowAddForm(false);
                await fetchModerators();
                await fetchCommunityMembers();
            }
        } catch {
            setError('Failed to add moderator');
        } finally {
            setAdding(false);
        }
    }

    async function handleRemove(modId: string, modUsername: string) {
        if (!confirm(`Remove ${modUsername} as moderator?`)) return;

        setRemoving(modId);
        setError('');

        try {
            const res = await fetch(`/api/communities/${communityId}/moderators?modId=${modId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to remove moderator');
            } else {
                setSuccess(`${modUsername} removed!`);
                await fetchModerators();
                await fetchCommunityMembers();
            }
        } catch {
            setError('Failed to remove moderator');
        } finally {
            setRemoving(null);
        }
    }

    const displayResults = searchQuery.length >= 2 ? searchResults : communityMembers;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Moderators ({moderators.length})
                </h3>
                {canAddMods && (
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setSelectedUser(null);
                            setSearchQuery('');
                        }}
                        className="btn btn-primary btn-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add
                    </button>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="alert alert-error text-sm py-2">
                    <ShieldAlert className="w-4 h-4" />
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success text-sm py-2">
                    <ShieldCheck className="w-4 h-4" />
                    {success}
                </div>
            )}

            {/* Add Form with Visible Member List */}
            {showAddForm && canAddMods && (
                <div className="bg-base-200 rounded-lg p-4 space-y-3">
                    {/* Selected User Display */}
                    {selectedUser && (
                        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden flex-shrink-0">
                                {selectedUser.image ? (
                                    <img src={selectedUser.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold">
                                        {selectedUser.username[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <span className="font-medium flex-1">{selectedUser.username}</span>
                            <span className="text-xs text-base-content/50">{selectedUser.reputation} rep</span>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="btn btn-ghost btn-xs btn-circle"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text text-sm">Search or select from list</span>
                        </label>
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Type to search users..."
                                className="input input-bordered input-sm w-full pl-9"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedUser(null);
                                }}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                            )}
                        </div>
                    </div>

                    {/* Always Visible Member List */}
                    <div className="bg-base-100 rounded-lg border border-base-content/10">
                        <div className="px-3 py-2 text-xs text-base-content/50 border-b border-base-content/10 flex items-center gap-2 bg-base-200/50">
                            <Users className="w-3 h-3" />
                            {searchQuery.length >= 2 ? 'Search Results' : 'Community Members'}
                            <span className="ml-auto">{displayResults.length} users</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {displayResults.length === 0 ? (
                                <div className="p-4 text-center text-sm text-base-content/50">
                                    {searchQuery.length >= 2 ? 'No users found' : 'No eligible members'}
                                </div>
                            ) : (
                                displayResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => selectUser(user)}
                                        className={`flex items-center gap-3 w-full p-2.5 hover:bg-base-200 transition-colors text-left border-b border-base-content/5 last:border-b-0 ${selectedUser?.id === user.id ? 'bg-primary/10' : ''
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-full bg-base-300 overflow-hidden flex-shrink-0">
                                            {user.image ? (
                                                <img src={user.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-sm">
                                                    {user.username[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{user.username}</div>
                                            <div className="text-xs text-base-content/50">{user.reputation} reputation</div>
                                        </div>
                                        {selectedUser?.id === user.id && (
                                            <div className="text-primary text-xs font-bold">Selected</div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text text-sm">Role</span>
                        </label>
                        <select
                            className="select select-bordered select-sm"
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'admin' | 'moderator')}
                        >
                            <option value="moderator">Moderator - Can manage posts</option>
                            {isCreator && (
                                <option value="admin">Admin - Can add mods too</option>
                            )}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={adding || !selectedUser}
                            className="btn btn-primary btn-sm flex-1"
                        >
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Moderator'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm(false);
                                setSelectedUser(null);
                                setSearchQuery('');
                            }}
                            className="btn btn-ghost btn-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Moderator List */}
            <div className="space-y-2">
                {moderators.map((mod) => {
                    const Icon = roleIcons[mod.role];
                    const canRemove = mod.role !== 'creator' && (
                        isCreator || (isAdmin && mod.role === 'moderator')
                    );

                    return (
                        <div
                            key={mod.id}
                            className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {mod.image ? (
                                    <img src={mod.image} alt={mod.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold">{mod.username[0]?.toUpperCase()}</span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{mod.username}</div>
                                <div className={`text-xs flex items-center gap-1 ${roleColors[mod.role]}`}>
                                    <Icon className="w-3 h-3" />
                                    {mod.role.charAt(0).toUpperCase() + mod.role.slice(1)}
                                    {mod.addedBy && (
                                        <span className="text-base-content/40 ml-1">
                                            • added by {mod.addedBy}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Remove Button */}
                            {canRemove && (
                                <button
                                    onClick={() => handleRemove(mod.id, mod.username)}
                                    disabled={removing === mod.id}
                                    className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/20"
                                    title="Remove moderator"
                                >
                                    {removing === mod.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <X className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Role Legend */}
            <div className="text-xs text-base-content/50 border-t border-base-200 pt-3 space-y-1">
                <div className="flex items-center gap-2">
                    <Crown className="w-3 h-3 text-warning" /> Creator - Full control
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-primary" /> Admin - Can add moderators
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-success" /> Moderator - Can manage posts
                </div>
            </div>
        </div>
    );
}

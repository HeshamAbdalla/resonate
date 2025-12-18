'use client';

import { useState, useEffect } from 'react';
import { Settings, Share2, Award, Zap, MessageSquare, ArrowUp, Calendar, Users, UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface ProfileHeaderProps {
    username: string;
    name?: string;
    bio?: string;
    image?: string;
    bannerImage?: string;
    reputation: number;
    postCount: number;
    commentCount: number;
    totalScore: number;  // Total upvotes received on all posts
    joinedAt: Date;
    isOwnProfile?: boolean;
    initialFollowersCount?: number;
    initialFollowingCount?: number;
}

function formatReputation(rep: number): string {
    if (rep >= 1000) {
        return `${(rep / 1000).toFixed(1)}k`;
    }
    return rep.toString();
}

function formatJoinDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

export default function ProfileHeader({
    username,
    name,
    bio,
    image,
    bannerImage,
    reputation,
    postCount,
    commentCount,
    totalScore,
    joinedAt,
    isOwnProfile = true,
    initialFollowersCount = 0,
    initialFollowingCount = 0,
}: ProfileHeaderProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(initialFollowersCount);
    const [followingCount, setFollowingCount] = useState(initialFollowingCount);

    // Fetch follow status on mount for non-own profiles
    useEffect(() => {
        if (!isOwnProfile) {
            async function checkFollowStatus() {
                try {
                    const res = await fetch(`/api/users/${username}/follow`);
                    if (res.ok) {
                        const data = await res.json();
                        setIsFollowing(data.isFollowing);
                        setFollowersCount(data.followersCount);
                        setFollowingCount(data.followingCount);
                    }
                } catch { /* ignore */ }
            }
            checkFollowStatus();
        }
    }, [username, isOwnProfile]);

    const handleFollow = async () => {
        if (followLoading) return;
        setFollowLoading(true);

        // Optimistic update
        const wasFollowing = isFollowing;
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

        try {
            const res = await fetch(`/api/users/${username}/follow`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.following);
            } else {
                // Revert
                setIsFollowing(wasFollowing);
                setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
            }
        } catch {
            // Revert
            setIsFollowing(wasFollowing);
            setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden mb-6">
            {/* Banner */}
            <div className="h-48 bg-gradient-to-r from-secondary/20 to-primary/20 relative overflow-hidden">
                {bannerImage ? (
                    <img src={bannerImage} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10" />
                )}
            </div>

            <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row items-end -mt-12 gap-6">

                    {/* Avatar */}
                    <div className="avatar">
                        <div className="w-32 rounded-2xl ring ring-base-100 ring-offset-base-100 ring-offset-4 bg-base-300 shadow-2xl">
                            {image ? (
                                <img src={image} alt={`${username}'s Avatar`} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary text-primary-content text-4xl font-bold">
                                    {username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl font-black mb-1 flex items-center gap-2">
                            u/{username}
                            {reputation > 1000 && (
                                <span className="badge badge-primary badge-outline text-xs">PRO</span>
                            )}
                        </h1>
                        {name && <p className="text-lg text-base-content/80 mb-1">{name}</p>}
                        {bio && <p className="text-sm text-base-content/60 mb-2">{bio}</p>}
                        <div className="text-base-content/60 font-medium text-sm flex gap-4 flex-wrap">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Joined {formatJoinDate(joinedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <strong>{formatCount(followersCount)}</strong> followers
                            </span>
                            <span className="flex items-center gap-1">
                                <strong>{formatCount(followingCount)}</strong> following
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-2 w-full md:w-auto flex-wrap">
                        {isOwnProfile ? (
                            <>
                                <a href="/profile/edit" className="btn btn-primary flex-1 md:flex-none gap-2">
                                    <Settings className="w-4 h-4" /> Edit Profile
                                </a>
                                <a href="/profile/settings" className="btn btn-ghost border border-base-content/10 flex-1 md:flex-none">
                                    Account Settings
                                </a>
                            </>
                        ) : (
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`btn flex-1 md:flex-none gap-2 ${isFollowing ? 'btn-outline' : 'btn-primary'
                                    }`}
                            >
                                {followLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isFollowing ? (
                                    <>
                                        <UserMinus className="w-4 h-4" /> Unfollow
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" /> Follow
                                    </>
                                )}
                            </button>
                        )}
                        <button className="btn btn-ghost btn-square border border-base-content/10">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {/* Resonance - Total reputation/karma */}
                    <div className="stats bg-base-200/50 border border-base-content/5 shadow-sm">
                        <div className="stat p-4">
                            <div className="stat-figure text-primary">
                                <ArrowUp className="w-6 h-6" />
                            </div>
                            <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Resonance</div>
                            <div className="stat-value text-2xl text-primary">{formatReputation(reputation)}</div>
                            <div className="stat-desc">
                                {reputation >= 1000 ? 'Top contributor' :
                                    reputation >= 500 ? 'Rising star' :
                                        reputation >= 100 ? 'Active user' : 'New member'}
                            </div>
                        </div>
                    </div>

                    {/* Posts */}
                    <div className="stats bg-base-200/50 border border-base-content/5 shadow-sm">
                        <div className="stat p-4">
                            <div className="stat-figure text-secondary">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Posts</div>
                            <div className="stat-value text-2xl text-secondary">{postCount}</div>
                            <div className="stat-desc">{postCount > 10 ? 'Active contributor' : 'Getting started'}</div>
                        </div>
                    </div>

                    {/* Impact - Total upvotes received */}
                    <div className="stats bg-base-200/50 border border-base-content/5 shadow-sm">
                        <div className="stat p-4">
                            <div className="stat-figure text-accent">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Impact</div>
                            <div className="stat-value text-2xl text-accent">{formatCount(totalScore)}</div>
                            <div className="stat-desc">
                                {totalScore >= 100 ? 'High influence' :
                                    totalScore >= 25 ? 'Growing reach' : 'Building presence'}
                            </div>
                        </div>
                    </div>

                    {/* Insight Score - Quality metric */}
                    <div className="stats bg-base-200/50 border border-base-content/5 shadow-sm">
                        <div className="stat p-4">
                            <div className="stat-figure text-success">
                                <Award className="w-6 h-6" />
                            </div>
                            <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Insight Score</div>
                            <div className="stat-value text-xl">
                                {postCount > 0 ? Math.min(100, Math.round((totalScore / postCount) * 10 + 50)) : 50}
                            </div>
                            <div className="stat-desc">
                                {postCount > 0 && (totalScore / postCount) >= 5 ? 'High quality' :
                                    postCount > 0 && (totalScore / postCount) >= 2 ? 'Good quality' : 'Average quality'}
                            </div>
                            <progress
                                className="progress progress-success w-full mt-2"
                                value={postCount > 0 ? Math.min(100, Math.round((totalScore / postCount) * 10 + 50)) : 50}
                                max="100"
                            ></progress>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

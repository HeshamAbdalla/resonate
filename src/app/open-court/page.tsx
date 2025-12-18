'use client';

import { useState, useEffect } from 'react';
import CourtCaseCard from '@/components/OpenCourt/CourtCaseCard';
import { Gavel, Trophy, Shield, Loader2, CheckCircle, AlertCircle, History, XCircle, Clock } from 'lucide-react';
import RightSidebarClient from '@/components/Layout/RightSidebarClient';

interface CourtCase {
    id: string;
    reason: string;
    description: string | null;
    reporter: string;
    createdAt: string;
    content: {
        author: string;
        text: string;
        timestamp: string;
        type: 'Post' | 'Comment';
        community: string;
    };
    context?: {
        postTitle: string;
    };
    aiAnalysis: {
        toxicityScore: number;
        flaggedKeywords: string[];
        confidence: string;
    };
    verdictCounts: {
        guilty: number;
        innocent: number;
    };
}

interface JurorStats {
    casesReviewed: number;
    guiltyVotes: number;
    innocentVotes: number;
    accuracy: number;
    rank: string;
    pendingCases: number;
}

interface VerdictHistoryItem {
    id: string;
    reportId: string;
    vote: string;
    votedAt: string;
    reason: string;
    targetType: string;
    status: string;
    targetInfo: {
        author: string;
        preview: string;
        community: string;
    } | null;
    outcome: {
        total: number;
        guilty: number;
        innocent: number;
        wasCorrect: boolean | null;
    };
}

export default function OpenCourtPage() {
    const [activeTab, setActiveTab] = useState<'cases' | 'history'>('cases');
    const [stats, setStats] = useState<JurorStats | null>(null);
    const [cases, setCases] = useState<CourtCase[]>([]);
    const [history, setHistory] = useState<VerdictHistoryItem[]>([]);
    const [activeCaseIndex, setActiveCaseIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch stats and cases on mount
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch stats
                const statsRes = await fetch('/api/open-court/stats');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Fetch cases
                const casesRes = await fetch('/api/open-court/cases');
                if (casesRes.ok) {
                    const casesData = await casesRes.json();
                    setCases(casesData.cases || []);
                }
            } catch (err) {
                setError('Failed to load data');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    // Fetch history when tab changes
    useEffect(() => {
        if (activeTab === 'history' && history.length === 0) {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/open-court/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleVote = async (vote: 'guilty' | 'innocent') => {
        if (!cases[activeCaseIndex]) return;

        setIsProcessing(true);

        try {
            const res = await fetch('/api/open-court/verdict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: cases[activeCaseIndex].id,
                    vote,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.stats) {
                    setStats(prev => prev ? {
                        ...prev,
                        casesReviewed: data.stats.casesReviewed,
                        guiltyVotes: data.stats.guiltyVotes,
                        innocentVotes: data.stats.innocentVotes,
                        rank: data.stats.rank,
                    } : null);
                }
                setActiveCaseIndex(prev => prev + 1);
                // Clear history cache so it refreshes
                setHistory([]);
            }
        } catch (err) {
            console.error('Error voting:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const isQueueEmpty = activeCaseIndex >= cases.length;
    const currentCase = cases[activeCaseIndex];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex gap-8 justify-center items-start pt-6">
                <div className="w-full max-w-3xl flex justify-center items-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-8 justify-center items-start pt-6">

            <div className="w-full max-w-3xl">

                {/* Header Section */}
                <div className="mb-8 motion-translate-y-in-[-10px] motion-opacity-in-[0%]">
                    <h1 className="text-3xl font-black flex items-center gap-3 mb-2">
                        <Gavel className="w-8 h-8 text-primary" />
                        Open Court
                    </h1>
                    <p className="text-base-content/70">
                        Review flagged reports. Apply <span className="font-bold text-base-content">Resonate Guidelines</span> to maintain discourse quality.
                    </p>
                </div>

                {/* User Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 motion-scale-in-[0.95] motion-opacity-in-[0%] motion-delay-[100ms]">
                    <div className="stat bg-base-100 shadow rounded-xl border border-base-content/5 py-4">
                        <div className="stat-figure text-primary">
                            <Gavel className="w-6 h-6 opacity-20" />
                        </div>
                        <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Cases Reviewed</div>
                        <div className="stat-value text-2xl text-primary">{stats?.casesReviewed || 0}</div>
                    </div>

                    <div className="stat bg-base-100 shadow rounded-xl border border-base-content/5 py-4">
                        <div className="stat-figure text-secondary">
                            <Trophy className="w-6 h-6 opacity-20" />
                        </div>
                        <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Verdicts</div>
                        <div className="stat-value text-2xl text-secondary">
                            <span className="text-error">{stats?.guiltyVotes || 0}</span>
                            <span className="text-base-content/30 mx-1">/</span>
                            <span className="text-success">{stats?.innocentVotes || 0}</span>
                        </div>
                        <div className="stat-desc">Guilty / Innocent</div>
                    </div>

                    <div className="stat bg-base-100 shadow rounded-xl border border-base-content/5 py-4">
                        <div className="stat-figure text-accent">
                            <Shield className="w-6 h-6 opacity-20" />
                        </div>
                        <div className="stat-title text-xs font-bold uppercase tracking-wider opacity-60">Juror Rank</div>
                        <div className="stat-value text-lg text-accent">{stats?.rank || 'Novice Juror'}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs tabs-boxed bg-base-200/50 mb-6 p-1">
                    <button
                        className={`tab flex-1 gap-2 ${activeTab === 'cases' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('cases')}
                    >
                        <Gavel className="w-4 h-4" />
                        Active Cases
                        {cases.length - activeCaseIndex > 0 && (
                            <span className="badge badge-sm badge-primary">{cases.length - activeCaseIndex}</span>
                        )}
                    </button>
                    <button
                        className={`tab flex-1 gap-2 ${activeTab === 'history' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History className="w-4 h-4" />
                        My History
                    </button>
                </div>

                {/* Active Cases Tab */}
                {activeTab === 'cases' && (
                    <>
                        {error ? (
                            <div className="card bg-base-100 p-12 text-center border border-error/20">
                                <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Error Loading Cases</h3>
                                <p className="text-base-content/60">{error}</p>
                            </div>
                        ) : !isQueueEmpty && currentCase ? (
                            <div key={activeCaseIndex} className={isProcessing ? 'motion-blur-out-[5px] motion-opacity-out-[0%] pointer-events-none' : ''}>
                                <CourtCaseCard
                                    id={currentCase.id}
                                    reason={currentCase.reason}
                                    reporter={currentCase.reporter}
                                    contentParams={currentCase.content}
                                    context={currentCase.context}
                                    aiAnalysis={currentCase.aiAnalysis}
                                    verdictCounts={currentCase.verdictCounts}
                                    onVote={handleVote}
                                />
                            </div>
                        ) : (
                            <div className="card bg-base-100 p-12 text-center border-dashed border-2 border-base-content/10 motion-scale-in-[0.9]">
                                <div className="mb-6 flex justify-center">
                                    <div className="p-4 bg-success/10 rounded-full animate-bounce">
                                        <CheckCircle className="w-12 h-12 text-success" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black mb-2">
                                    {cases.length === 0 ? 'No Cases to Review' : 'Docket Cleared!'}
                                </h3>
                                <p className="text-base-content/60 max-w-md mx-auto">
                                    {cases.length === 0
                                        ? 'There are no pending reports to review. Check back later or report content that violates guidelines.'
                                        : "You've reviewed all pending cases in your queue. Your contributions help keep Resonate insightful and safe."
                                    }
                                </p>
                                {cases.length > 0 && (
                                    <button
                                        className="btn btn-primary mt-8 btn-wide"
                                        onClick={() => window.location.reload()}
                                    >
                                        Check for New Cases
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-3">
                        {historyLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="card bg-base-100 p-12 text-center border-dashed border-2 border-base-content/10">
                                <History className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                <h3 className="text-xl font-bold mb-2">No History Yet</h3>
                                <p className="text-base-content/60">
                                    Review some cases to build your juror history.
                                </p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    className="card bg-base-100 border border-base-content/5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="card-body p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`badge badge-sm ${item.vote === 'guilty' ? 'badge-error' : 'badge-success'}`}>
                                                        {item.vote === 'guilty' ? (
                                                            <><XCircle className="w-3 h-3 mr-1" />Guilty</>
                                                        ) : (
                                                            <><CheckCircle className="w-3 h-3 mr-1" />Innocent</>
                                                        )}
                                                    </span>
                                                    <span className="badge badge-ghost badge-sm">{item.reason}</span>
                                                    <span className="badge badge-ghost badge-sm capitalize">{item.targetType}</span>
                                                </div>

                                                {item.targetInfo ? (
                                                    <p className="text-sm text-base-content/80 line-clamp-2">
                                                        <span className="font-medium">u/{item.targetInfo.author}:</span> {item.targetInfo.preview}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-base-content/50 italic">Content was removed</p>
                                                )}

                                                <div className="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(item.votedAt)}
                                                    </span>
                                                    <span>
                                                        Votes: {item.outcome.guilty} guilty / {item.outcome.innocent} innocent
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`badge ${item.status === 'reviewed' ? 'badge-error' :
                                                        item.status === 'dismissed' ? 'badge-success' :
                                                            'badge-warning'
                                                    } badge-outline badge-sm`}>
                                                    {item.status === 'reviewed' ? 'Removed' :
                                                        item.status === 'dismissed' ? 'Dismissed' :
                                                            'Pending'}
                                                </span>
                                                {item.outcome.wasCorrect !== null && (
                                                    <span className={`text-xs ${item.outcome.wasCorrect ? 'text-success' : 'text-error'}`}>
                                                        {item.outcome.wasCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>

            {/* Reusing main sidebar for now, maybe custom widgets later */}
            <RightSidebarClient />

        </div>
    );
}

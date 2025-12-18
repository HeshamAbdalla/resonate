import { AlertTriangle, CheckCircle, XCircle, Shield, Users, BrainCircuit } from 'lucide-react';

interface CaseProps {
    id: string;
    reason: string;
    reporter?: string;
    context?: {
        postTitle?: string;
    };
    contentParams: {
        author: string;
        text: string;
        timestamp: string;
        type: 'Comment' | 'Post';
        community?: string;
    };
    aiAnalysis?: {
        toxicityScore: number;
        flaggedKeywords: string[];
        confidence: string;
    };
    verdictCounts?: {
        guilty: number;
        innocent: number;
    };
    onVote: (vote: 'guilty' | 'innocent') => void;
}

// Map reason to policy info
const policyMap: Record<string, { rule: string; description: string }> = {
    'Hate Speech': {
        rule: 'Rule 1: Civility',
        description: 'Attack the argument, not the person. Personal insults and hate speech are strictly prohibited.',
    },
    'Harassment': {
        rule: 'Rule 1: Civility',
        description: 'Harassment, bullying, or targeting other users is not allowed.',
    },
    'Misinformation': {
        rule: 'Rule 4: Authenticity',
        description: 'Content verified as demonstrably false or misleading can be flagged for review.',
    },
    'Spam': {
        rule: 'Rule 7: No Spam',
        description: 'Excessive self-promotion or affiliate links without community contribution.',
    },
    'Violence': {
        rule: 'Rule 2: Safety',
        description: 'Threats of violence or content promoting harm to others is prohibited.',
    },
    'NSFW': {
        rule: 'Rule 5: NSFW Content',
        description: 'Explicit content must be properly marked and only in appropriate communities.',
    },
    'Other': {
        rule: 'Community Guidelines',
        description: 'Content that violates the general principles of respectful discourse.',
    },
};

export default function CourtCaseCard({ id, reason, reporter, context, contentParams, aiAnalysis, verdictCounts, onVote }: CaseProps) {
    const policy = policyMap[reason] || policyMap['Other'];
    const totalVotes = (verdictCounts?.guilty || 0) + (verdictCounts?.innocent || 0);

    const getToxicityColor = (score: number) => {
        if (score < 30) return 'progress-success';
        if (score < 60) return 'progress-warning';
        return 'progress-error';
    };

    const getToxicityBadge = (score: number) => {
        if (score < 30) return { text: 'Low Risk', class: 'badge-success' };
        if (score < 60) return { text: 'Medium Risk', class: 'badge-warning' };
        return { text: 'High Risk', class: 'badge-error' };
    };

    return (
        <div className="card bg-base-100 shadow-2xl border border-base-content/5 motion-scale-in-[0.98] motion-duration-300 overflow-hidden">

            {/* Header: The Accusation */}
            <div className="bg-base-200/50 border-b border-base-content/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-error/10 rounded-full text-error motion-pulse-loop">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base-content/90 flex items-center gap-2">
                            Flagged for {reason}
                            {aiAnalysis && aiAnalysis.toxicityScore >= 60 && (
                                <span className="badge badge-error badge-outline badge-xs text-[10px] uppercase font-bold">High Priority</span>
                            )}
                        </h3>
                        <p className="text-xs text-base-content/60">
                            Reported by {reporter || 'Community Member'}
                            {contentParams.community && ` • in r/${contentParams.community}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {totalVotes > 0 && (
                        <div className="flex items-center gap-1 text-xs text-base-content/40">
                            <Users className="w-3 h-3" />
                            <span>{totalVotes} verdict{totalVotes !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                    <div className="text-xs font-mono text-base-content/40 bg-base-300/50 px-2 py-1 rounded">
                        {id.slice(0, 8)}
                    </div>
                </div>
            </div>

            <div className="p-6 grid gap-6">

                {/* AI Insight + Policy Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 motion-translate-x-in-[-10px] motion-opacity-in-[0%] motion-delay-[100ms]">

                    {/* AI Analysis */}
                    {aiAnalysis && (
                        <div className="bg-base-200/30 p-4 rounded-lg border border-base-content/5">
                            <div className="flex items-center gap-2 mb-3">
                                <BrainCircuit className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">AI Forensics</span>
                                <span className={`badge badge-xs ml-auto ${getToxicityBadge(aiAnalysis.toxicityScore).class}`}>
                                    {getToxicityBadge(aiAnalysis.toxicityScore).text}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span>Toxicity Probability</span>
                                <span className="font-bold">{aiAnalysis.toxicityScore}%</span>
                            </div>
                            <progress
                                className={`progress w-full h-2 mb-3 ${getToxicityColor(aiAnalysis.toxicityScore)}`}
                                value={aiAnalysis.toxicityScore}
                                max="100"
                            ></progress>
                            {aiAnalysis.flaggedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {aiAnalysis.flaggedKeywords.map(kw => (
                                        <span key={kw} className="badge badge-xs badge-ghost border-base-content/20 text-base-content/60">"{kw}"</span>
                                    ))}
                                </div>
                            )}
                            {aiAnalysis.flaggedKeywords.length === 0 && (
                                <p className="text-xs text-base-content/50 italic">No specific keywords flagged</p>
                            )}
                        </div>
                    )}

                    {/* Policy Reference */}
                    <div className="bg-base-200/30 p-4 rounded-lg border border-base-content/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-secondary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">Jurisprudence</span>
                        </div>
                        <div className="text-sm font-bold text-base-content/90 mb-1">{policy.rule}</div>
                        <p className="text-xs text-base-content/70 leading-relaxed">
                            {policy.description}
                        </p>
                    </div>
                </div>

                {/* Evidence Section */}
                <div className="border-l-2 border-base-content/10 pl-4 motion-translate-y-in-[10px] motion-opacity-in-[0%] motion-delay-[200ms]">

                    {/* Context (Post Title for comments) */}
                    {context?.postTitle && (
                        <div className="mb-4 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="text-xs text-base-content/50 mb-1">On post:</div>
                            <div className="bg-base-200 p-2 rounded text-sm font-medium">
                                "{context.postTitle}"
                            </div>
                        </div>
                    )}

                    {/* The Suspect Content */}
                    <div className="relative">
                        <div className="absolute -left-[21px] top-4 w-3 h-3 bg-error rounded-full ring-4 ring-base-100"></div>
                        <div className="bg-error/5 p-5 rounded-xl border border-error/20 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="avatar placeholder">
                                    <div className="bg-neutral text-neutral-content rounded-full w-6">
                                        <span className="text-xs">{contentParams.author[0]?.toUpperCase()}</span>
                                    </div>
                                </div>
                                <span className="font-bold text-sm text-base-content">{contentParams.author}</span>
                                <span className="badge badge-sm badge-error badge-outline">Reported {contentParams.type}</span>
                                <span className="text-xs text-base-content/40 ml-auto">{contentParams.timestamp}</span>
                            </div>
                            <p className="text-lg leading-relaxed font-serif text-base-content/90 whitespace-pre-wrap">
                                {contentParams.text}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Current Verdict Tally */}
                {totalVotes > 0 && (
                    <div className="flex items-center justify-center gap-6 py-2 motion-opacity-in-[0%] motion-delay-[250ms]">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-error">{verdictCounts?.guilty || 0}</span>
                            <span className="text-base-content/50">guilty</span>
                        </div>
                        <div className="w-32 h-2 bg-base-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-error"
                                style={{
                                    width: `${(verdictCounts?.guilty || 0) / totalVotes * 100}%`
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-success">{verdictCounts?.innocent || 0}</span>
                            <span className="text-base-content/50">innocent</span>
                        </div>
                    </div>
                )}

                {/* Verdict Buttons */}
                <div className="motion-translate-y-in-[10px] motion-opacity-in-[0%] motion-delay-[300ms]">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => onVote('innocent')}
                            className="btn btn-lg btn-outline border-base-content/10 hover:bg-success hover:border-success hover:text-success-content group bg-base-100"
                        >
                            <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform text-success" />
                            Not Guilty
                        </button>

                        <button
                            onClick={() => onVote('guilty')}
                            className="btn btn-lg btn-outline border-base-content/10 hover:bg-error hover:border-error hover:text-error-content group bg-base-100"
                        >
                            <XCircle className="w-6 h-6 group-hover:scale-110 transition-transform text-error" />
                            Guilty
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <span className="text-[10px] text-base-content/30 uppercase tracking-widest font-bold">Juror Actions are Final</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

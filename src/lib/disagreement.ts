// Disagreement Detection Utilities
// Detects good-faith disagreement signals in comment content

const DISAGREEMENT_PHRASES = [
    'i disagree',
    "i don't think",
    "i don't agree",
    'that misses',
    'counterpoint',
    'on the other hand',
    'actually,',
    'but consider',
    'however,',
    'that overlooks',
    'not quite',
    'i see it differently',
    'alternative view',
    'to be fair',
    'playing devil',
    'respectfully,',
    'while i understand',
    'that said,',
    'i would argue',
];

const AGGRESSIVE_PHRASES = [
    'you\'re stupid',
    'you\'re an idiot',
    'shut up',
    'stfu',
    'this is bullshit',
    'what the fuck',
    'wtf',
    'dumbass',
    'moron',
    'you\'re wrong and',
    'absolutely wrong',
    'completely wrong',
    'obviously you',
    'clearly you don\'t',
];

export interface DisagreementAnalysis {
    isDisagreement: boolean;
    isGoodFaith: boolean;
    isAggressive: boolean;
    confidence: number;
    signals: string[];
}

/**
 * Analyzes content for disagreement signals
 * Returns whether this is a good-faith disagreement
 */
export function detectDisagreement(content: string): DisagreementAnalysis {
    const lowerContent = content.toLowerCase().trim();
    const signals: string[] = [];

    // Check for disagreement phrases
    let disagreementScore = 0;
    for (const phrase of DISAGREEMENT_PHRASES) {
        if (lowerContent.includes(phrase)) {
            signals.push(phrase);
            disagreementScore += 1;
        }
    }

    // Check for aggressive language
    let aggressiveScore = 0;
    for (const phrase of AGGRESSIVE_PHRASES) {
        if (lowerContent.includes(phrase)) {
            aggressiveScore += 1;
        }
    }

    // Content length check (> 40 chars indicates thoughtful reply)
    const isSubstantial = content.length > 40;

    // Determine if this is disagreement
    const isDisagreement = disagreementScore > 0 && isSubstantial;

    // Determine if it's good faith (disagreement without aggression)
    const isGoodFaith = isDisagreement && aggressiveScore === 0;

    // Confidence based on signal strength
    const confidence = Math.min(1, disagreementScore * 0.3 + (isSubstantial ? 0.2 : 0));

    return {
        isDisagreement,
        isGoodFaith,
        isAggressive: aggressiveScore > 0,
        confidence,
        signals,
    };
}

/**
 * Checks if content contains aggressive language
 * Used for soft nudges during composition
 */
export function detectAggressiveLanguage(content: string): {
    hasAggression: boolean;
    suggestions: string[];
} {
    const lowerContent = content.toLowerCase();
    const suggestions: string[] = [];

    for (const phrase of AGGRESSIVE_PHRASES) {
        if (lowerContent.includes(phrase)) {
            suggestions.push('Strong ideas land better without personal attacks.');
            break;
        }
    }

    // Check for "you" statements that might be personal
    if (/you('re| are) (wrong|stupid|ignorant|clueless)/i.test(content)) {
        suggestions.push('Address the idea, not the person.');
    }

    return {
        hasAggression: suggestions.length > 0,
        suggestions,
    };
}

/**
 * Determines if a thread shows signs of healthy debate
 * Used for "Thoughtful debate" badge
 */
export function isHealthyDebate(replies: { content: string; authorId: string }[]): boolean {
    if (replies.length < 2) return false;

    // Check for back-and-forth (multiple authors)
    const uniqueAuthors = new Set(replies.map(r => r.authorId));
    if (uniqueAuthors.size < 2) return false;

    // Check that no replies are aggressive
    for (const reply of replies) {
        const analysis = detectDisagreement(reply.content);
        if (analysis.isAggressive) return false;
    }

    // Check for substantive responses
    const substantiveReplies = replies.filter(r => r.content.length > 60);
    if (substantiveReplies.length < 2) return false;

    return true;
}

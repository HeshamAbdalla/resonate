// Server-side Disagreement Detection
// Runs when comments are created to flag disagreements

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
    "you're stupid",
    "you're an idiot",
    'shut up',
    'stfu',
    'this is bullshit',
    'what the fuck',
    'wtf',
    'dumbass',
    'moron',
    "you're wrong and",
    'absolutely wrong',
    'completely wrong',
    'obviously you',
    "clearly you don't",
];

export interface ServerDisagreementResult {
    isDisagreement: boolean;
    isGoodFaith: boolean;
    isAggressive: boolean;
}

/**
 * Server-side detection of good-faith disagreement
 */
export function detectDisagreementServer(content: string): ServerDisagreementResult {
    const lowerContent = content.toLowerCase().trim();

    // Check for disagreement phrases
    let hasDisagreement = false;
    for (const phrase of DISAGREEMENT_PHRASES) {
        if (lowerContent.includes(phrase)) {
            hasDisagreement = true;
            break;
        }
    }

    // Check for aggressive language
    let isAggressive = false;
    for (const phrase of AGGRESSIVE_PHRASES) {
        if (lowerContent.includes(phrase)) {
            isAggressive = true;
            break;
        }
    }

    // Content length check (> 40 chars indicates thoughtful reply)
    const isSubstantial = content.length > 40;

    // Determine if this is good-faith disagreement
    const isDisagreement = hasDisagreement && isSubstantial;
    const isGoodFaith = isDisagreement && !isAggressive;

    return {
        isDisagreement,
        isGoodFaith,
        isAggressive,
    };
}

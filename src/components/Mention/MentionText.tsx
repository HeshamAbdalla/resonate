'use client';

import Link from 'next/link';
import { Fragment } from 'react';

interface MentionTextProps {
    content: string;
    className?: string;
}

/**
 * Renders text content with @mentions as styled, clickable profile links
 */
export default function MentionText({ content, className = '' }: MentionTextProps) {
    // Parse content and split by mentions
    const mentionRegex = /@([a-zA-Z0-9_]{3,20})\b/g;
    const parts: (string | { type: 'mention'; username: string })[] = [];

    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }
        // Add mention
        parts.push({ type: 'mention', username: match[1] });
        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    if (parts.length === 0) {
        return <span className={className}>{content}</span>;
    }

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (typeof part === 'string') {
                    return <Fragment key={index}>{part}</Fragment>;
                }
                return (
                    <Link
                        key={index}
                        href={`/u/${part.username}`}
                        className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 font-medium bg-primary/10 hover:bg-primary/15 px-1 py-0.5 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="opacity-70">@</span>
                        <span>{part.username}</span>
                    </Link>
                );
            })}
        </span>
    );
}

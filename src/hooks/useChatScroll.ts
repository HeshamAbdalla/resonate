'use client';

import { useEffect, useRef } from 'react';

export function useChatScroll<T extends HTMLElement>(
    dependency: unknown[]
) {
    const ref = useRef<T>(null);
    const shouldScrollRef = useRef(true);

    // Check if user is near bottom before new messages arrive
    const handleScroll = () => {
        if (!ref.current) return;
        const { scrollTop, scrollHeight, clientHeight } = ref.current;
        shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    useEffect(() => {
        const element = ref.current;
        if (element) {
            element.addEventListener('scroll', handleScroll);
            return () => element.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Scroll to bottom when dependency changes
    useEffect(() => {
        if (shouldScrollRef.current && ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, dependency);

    return ref;
}

'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AtSign } from 'lucide-react';

interface User {
    id: string;
    username: string;
    name?: string | null;
    image?: string | null;
}

export interface MentionTextareaRef {
    focus: () => void;
    insertMentionTrigger: () => void;
}

interface MentionTextareaProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onFocus?: () => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    rows?: number;
    autoFocus?: boolean;
}

const MentionTextarea = forwardRef<MentionTextareaRef, MentionTextareaProps>(({
    value,
    onChange,
    onKeyDown,
    onFocus,
    placeholder = "What's your take?",
    className = '',
    disabled = false,
    rows = 4,
    autoFocus = false,
}, ref) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('above');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        focus: () => textareaRef.current?.focus(),
        insertMentionTrigger: () => {
            if (textareaRef.current) {
                const cursorPos = textareaRef.current.selectionStart;
                const before = value.slice(0, cursorPos);
                const after = value.slice(cursorPos);
                const newValue = `${before}@${after}`;
                onChange(newValue);

                // Trigger detection after state update
                setTimeout(() => {
                    textareaRef.current?.focus();
                    const newPos = cursorPos + 1;
                    textareaRef.current?.setSelectionRange(newPos, newPos);
                    detectMention(newValue, newPos);
                }, 0);
            }
        },
    }));

    // Calculate dropdown position based on available space
    const calculatePosition = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropdownPosition(spaceBelow < 250 && spaceAbove > spaceBelow ? 'above' : 'below');
        }
    }, []);

    // Detect @ trigger and extract query
    const detectMention = useCallback((text: string, cursorPos: number) => {
        // Find the last @ before cursor
        const textBeforeCursor = text.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1) {
            setShowSuggestions(false);
            setMentionQuery('');
            setMentionStartPos(-1);
            return;
        }

        // Check if @ is at start or after a space/newline
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
        if (!/[\s\n]/.test(charBeforeAt) && lastAtIndex !== 0) {
            setShowSuggestions(false);
            setMentionQuery('');
            setMentionStartPos(-1);
            return;
        }

        // Check if there's a space between @ and cursor
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
            setShowSuggestions(false);
            setMentionQuery('');
            setMentionStartPos(-1);
            return;
        }

        // Valid mention in progress
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setShowSuggestions(true);
        setSelectedIndex(0);
        calculatePosition();
    }, [calculatePosition]);

    // Fetch suggestions with debounce
    useEffect(() => {
        if (!showSuggestions) {
            setSuggestions([]);
            return;
        }

        // Show loading immediately, fetch even with empty query
        setLoading(true);

        const fetchSuggestions = async () => {
            try {
                const query = mentionQuery.length > 0 ? mentionQuery : '';
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=6`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.users || []);
                }
            } catch (e) {
                console.error('Error fetching mention suggestions:', e);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 100);
        return () => clearTimeout(timer);
    }, [mentionQuery, showSuggestions]);

    // Insert mention
    const insertMention = useCallback((user: User) => {
        if (mentionStartPos === -1) return;

        const beforeMention = value.slice(0, mentionStartPos);
        const afterMention = value.slice(mentionStartPos + mentionQuery.length + 1);
        const newValue = `${beforeMention}@${user.username} ${afterMention}`;

        onChange(newValue);
        setShowSuggestions(false);
        setMentionQuery('');
        setMentionStartPos(-1);

        // Focus back on textarea
        setTimeout(() => {
            textareaRef.current?.focus();
            const newCursorPos = mentionStartPos + user.username.length + 2;
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }, [value, onChange, mentionStartPos, mentionQuery]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % suggestions.length);
                    return;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                    return;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    insertMention(suggestions[selectedIndex]);
                    return;
                case 'Escape':
                    e.preventDefault();
                    setShowSuggestions(false);
                    return;
            }
        }

        // Pass through to parent handler
        onKeyDown?.(e);
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        detectMention(newValue, e.target.selectionStart || 0);
    };

    // Handle selection change
    const handleSelect = () => {
        if (textareaRef.current && showSuggestions) {
            detectMention(value, textareaRef.current.selectionStart || 0);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onSelect={handleSelect}
                onFocus={onFocus}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                rows={rows}
                className={className}
            />

            {/* Mention Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, y: dropdownPosition === 'above' ? 10 : -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: dropdownPosition === 'above' ? 10 : -10 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute left-4 right-4 bg-base-100 border border-primary/20 rounded-xl shadow-2xl z-50 overflow-hidden ${dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
                            }`}
                    >
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-base-content/10 bg-base-200/50">
                            <div className="flex items-center gap-2 text-xs text-base-content/60">
                                <AtSign className="w-3 h-3" />
                                <span>Mention someone</span>
                                {mentionQuery && (
                                    <span className="ml-auto text-primary font-medium">"{mentionQuery}"</span>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-56 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-6 text-base-content/50">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Searching...</span>
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-base-content/50">No users found</p>
                                    <p className="text-xs text-base-content/30 mt-1">Try a different name</p>
                                </div>
                            ) : (
                                suggestions.map((user, index) => (
                                    <motion.button
                                        key={user.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0, transition: { delay: index * 0.03 } }}
                                        onClick={() => insertMention(user)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${index === selectedIndex
                                                ? 'bg-primary/10 border-l-2 border-primary'
                                                : 'hover:bg-base-200 border-l-2 border-transparent'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-base-100">
                                            {user.image ? (
                                                <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-primary-content text-sm font-bold">
                                                    {user.username[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">
                                                {user.name || user.username}
                                            </p>
                                            <p className="text-xs text-primary truncate">
                                                @{user.username}
                                            </p>
                                        </div>

                                        {/* Keyboard hint */}
                                        {index === selectedIndex && (
                                            <div className="flex items-center gap-1 text-[10px] text-base-content/40">
                                                <kbd className="px-1.5 py-0.5 bg-base-200 rounded text-[10px]">↵</kbd>
                                            </div>
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </div>

                        {/* Footer hint */}
                        {suggestions.length > 0 && (
                            <div className="px-3 py-1.5 border-t border-base-content/10 bg-base-200/50 flex items-center justify-between text-[10px] text-base-content/40">
                                <span>↑↓ navigate</span>
                                <span>↵ select</span>
                                <span>esc close</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

MentionTextarea.displayName = 'MentionTextarea';

export default MentionTextarea;

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    username: string;
    name?: string | null;
    image?: string | null;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    multiline?: boolean;
    rows?: number;
    autoFocus?: boolean;
}

export default function MentionInput({
    value,
    onChange,
    onSubmit,
    placeholder = 'Type a message...',
    className = '',
    disabled = false,
    multiline = false,
    rows = 3,
    autoFocus = false,
}: MentionInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState(-1);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

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

        // Check if there's a space between @ and cursor
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        if (textAfterAt.includes(' ')) {
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
    }, []);

    // Fetch suggestions
    useEffect(() => {
        if (!showSuggestions || mentionQuery.length < 1) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}&limit=5`);
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

        const timer = setTimeout(fetchSuggestions, 150);
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

        // Focus back on input
        setTimeout(() => {
            inputRef.current?.focus();
            const newCursorPos = mentionStartPos + user.username.length + 2;
            inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }, [value, onChange, mentionStartPos, mentionQuery]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter' && !e.shiftKey && !multiline) {
                e.preventDefault();
                onSubmit?.();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                insertMention(suggestions[selectedIndex]);
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
        }
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        detectMention(newValue, e.target.selectionStart || 0);
    };

    // Handle click (to detect if cursor is in a mention)
    const handleClick = () => {
        if (inputRef.current) {
            detectMention(value, inputRef.current.selectionStart || 0);
        }
    };

    const InputComponent = multiline ? 'textarea' : 'input';

    return (
        <div className="relative">
            <InputComponent
                ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
                type={multiline ? undefined : 'text'}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={handleClick}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                rows={multiline ? rows : undefined}
                className={`w-full ${className}`}
            />

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && (suggestions.length > 0 || loading) && (
                    <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 bottom-full mb-2 w-64 bg-base-100 border border-base-content/10 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                        {loading ? (
                            <div className="p-3 text-center text-sm text-base-content/50">
                                Searching...
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="p-3 text-center text-sm text-base-content/50">
                                No users found
                            </div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto">
                                {suggestions.map((user, index) => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user)}
                                        className={`w-full flex items-center gap-3 p-2 text-left transition-colors ${index === selectedIndex
                                                ? 'bg-primary/10'
                                                : 'hover:bg-base-200'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {user.image ? (
                                                <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-primary-content text-sm font-bold">
                                                    {user.username[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {user.name || user.username}
                                            </p>
                                            <p className="text-xs text-base-content/50 truncate">
                                                @{user.username}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

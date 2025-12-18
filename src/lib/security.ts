/**
 * Input sanitization and validation utilities for security
 */

// HTML entities to escape for XSS prevention
const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize user input - trims and escapes HTML
 */
export function sanitizeText(text: string | null | undefined): string {
    if (!text) return '';
    return escapeHtml(text.trim());
}

/**
 * Validate and truncate text to max length
 */
export function validateLength(text: string, maxLength: number): { valid: boolean; text: string; error?: string } {
    const trimmed = text.trim();
    if (trimmed.length > maxLength) {
        return {
            valid: false,
            text: trimmed,
            error: `Content exceeds maximum length of ${maxLength} characters`,
        };
    }
    return { valid: true, text: trimmed };
}

/**
 * Content length limits
 */
export const CONTENT_LIMITS = {
    POST_TITLE: 300,
    POST_CONTENT: 40000,
    COMMENT: 10000,
    BIO: 200,
    COMMUNITY_NAME: 50,
    COMMUNITY_DESCRIPTION: 500,
    USERNAME: 30,
} as const;

/**
 * Validate post title
 */
export function validatePostTitle(title: string): { valid: boolean; title: string; error?: string } {
    const result = validateLength(title, CONTENT_LIMITS.POST_TITLE);
    if (!result.valid) return { valid: false, title: result.text, error: result.error };
    if (result.text.length < 3) {
        return { valid: false, title: result.text, error: 'Title must be at least 3 characters' };
    }
    return { valid: true, title: result.text };
}

/**
 * Validate post content
 */
export function validatePostContent(content: string | null): { valid: boolean; content: string | null; error?: string } {
    if (!content) return { valid: true, content: null };
    const result = validateLength(content, CONTENT_LIMITS.POST_CONTENT);
    if (!result.valid) return { valid: false, content: result.text, error: result.error };
    return { valid: true, content: result.text };
}

/**
 * Validate comment content
 */
export function validateComment(content: string): { valid: boolean; content: string; error?: string } {
    const result = validateLength(content, CONTENT_LIMITS.COMMENT);
    if (!result.valid) return { valid: false, content: result.text, error: result.error };
    if (result.text.length < 1) {
        return { valid: false, content: result.text, error: 'Comment cannot be empty' };
    }
    return { valid: true, content: result.text };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

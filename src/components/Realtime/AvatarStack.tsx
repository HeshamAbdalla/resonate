'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AvatarStackProps {
    users: Array<{
        id: string;
        username: string;
        image: string | null;
    }>;
    maxAvatars?: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
}

const sizeConfig = {
    sm: {
        avatar: 'w-7 h-7',
        text: 'text-[10px]',
        overlap: '-ml-2.5',
        ring: 'ring-2',
        dot: 'w-1.5 h-1.5 border',
    },
    md: {
        avatar: 'w-9 h-9',
        text: 'text-xs',
        overlap: '-ml-3',
        ring: 'ring-2',
        dot: 'w-2 h-2 border-2',
    },
    lg: {
        avatar: 'w-11 h-11',
        text: 'text-sm',
        overlap: '-ml-3.5',
        ring: 'ring-[3px]',
        dot: 'w-2.5 h-2.5 border-2',
    },
};

/**
 * Supabase-style Avatar Stack - Overlapping avatars with realtime presence
 */
export default function AvatarStack({
    users,
    maxAvatars = 5,
    size = 'md',
    showCount = true
}: AvatarStackProps) {
    const config = sizeConfig[size];
    const displayUsers = users.slice(0, maxAvatars);
    const remainingCount = Math.max(0, users.length - maxAvatars);

    if (users.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {/* Stacked Avatars */}
            <div className="flex items-center">
                <AnimatePresence mode="popLayout">
                    {displayUsers.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: -20 }}
                            transition={{
                                type: 'spring',
                                stiffness: 350,
                                damping: 25,
                                delay: index * 0.05
                            }}
                            className={`
                                ${config.avatar} 
                                ${index > 0 ? config.overlap : ''} 
                                ${config.ring}
                                ring-base-100 dark:ring-base-300
                                rounded-full bg-gradient-to-br from-primary/20 to-secondary/20
                                flex items-center justify-center overflow-hidden
                                shadow-lg hover:z-20 hover:scale-110 
                                transition-transform duration-200 ease-out
                                relative cursor-pointer group
                            `}
                            style={{ zIndex: maxAvatars - index + 10 }}
                        >
                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                />
                            ) : (
                                <span className={`font-bold text-base-content/80 ${config.text}`}>
                                    {user.username[0]?.toUpperCase() || '?'}
                                </span>
                            )}

                            {/* Online Indicator Dot */}
                            <span
                                className={`
                                    absolute bottom-0 right-0 
                                    ${config.dot}
                                    bg-success rounded-full border-base-100
                                    shadow-sm
                                `}
                            />

                            {/* Hover Tooltip */}
                            <div
                                className="
                                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                    px-2 py-1 bg-base-300/95 backdrop-blur-sm
                                    text-xs font-medium rounded-md shadow-lg
                                    opacity-0 group-hover:opacity-100 
                                    scale-90 group-hover:scale-100
                                    transition-all duration-150
                                    whitespace-nowrap pointer-events-none z-50
                                "
                            >
                                {user.username}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-base-300/95" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Overflow Badge */}
                {remainingCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`
                            ${config.avatar} 
                            ${config.overlap}
                            ${config.ring}
                            ring-base-100 dark:ring-base-300
                            rounded-full bg-base-200 
                            flex items-center justify-center 
                            font-bold ${config.text} text-base-content/60
                            shadow-lg
                        `}
                        style={{ zIndex: 5 }}
                    >
                        +{remainingCount}
                    </motion.div>
                )}
            </div>

            {/* Online Count Label */}
            {showCount && (
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-base-content/60">
                        {users.length} online
                    </span>
                </div>
            )}
        </div>
    );
}

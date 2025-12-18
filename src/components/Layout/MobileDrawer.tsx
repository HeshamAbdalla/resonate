'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Context for drawer state
interface DrawerContextType {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

const DrawerContext = createContext<DrawerContextType>({
    isOpen: false,
    open: () => { },
    close: () => { },
    toggle: () => { },
});

export const useDrawer = () => useContext(DrawerContext);

// Provider component
export function DrawerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(prev => !prev);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) close();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <DrawerContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
        </DrawerContext.Provider>
    );
}

// Drawer Component
interface MobileDrawerProps {
    children: ReactNode;
}

export default function MobileDrawer({ children }: MobileDrawerProps) {
    const { isOpen, close } = useDrawer();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={close}
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        className="fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-base-100 z-50 lg:hidden shadow-2xl"
                    >
                        {/* Close button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            onClick={close}
                            className="absolute top-4 right-4 btn btn-ghost btn-circle btn-sm"
                        >
                            <X className="w-5 h-5" />
                        </motion.button>

                        {/* Drawer Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="p-4 border-b border-base-content/10"
                        >
                            <span
                                className="text-xl font-black tracking-widest bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600 bg-clip-text text-transparent italic"
                                style={{ fontFamily: '"Orbitron", sans-serif' }}
                            >
                                RESONATE
                            </span>
                        </motion.div>

                        {/* Drawer Content with staggered animation */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="h-[calc(100%-4rem)] overflow-y-auto"
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Drawer Toggle Button (for Navbar)
export function DrawerToggle({ className = '' }: { className?: string }) {
    const { toggle } = useDrawer();

    return (
        <button
            onClick={toggle}
            className={`btn btn-ghost btn-circle btn-sm lg:hidden ${className}`}
            aria-label="Toggle menu"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    );
}

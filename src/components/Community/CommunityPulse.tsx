'use client';

import { useState, useEffect } from 'react';
import { Activity, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommunityPulseProps {
    communityId: string;
}

export default function CommunityPulse({ communityId }: CommunityPulseProps) {
    const [data, setData] = useState<number[]>([]);
    const [percentChange, setPercentChange] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch(`/api/communities/${communityId}/activity`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result.hourlyActivity);
                    setPercentChange(result.percentChange);
                } else {
                    setError(true);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        if (communityId) {
            fetchActivity();
            // Refresh every 5 minutes
            const interval = setInterval(fetchActivity, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [communityId]);

    // Handle loading and error states
    if (loading) {
        return (
            <div className="bg-base-100/50 backdrop-blur-sm border border-base-content/5 rounded-xl p-4 w-full max-w-xs">
                <div className="flex items-center justify-center h-20">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // If no data or error, show minimal state
    const hasActivity = data.length > 0 && data.some(v => v > 0);

    if (!hasActivity || error) {
        return (
            <div className="bg-base-100/50 backdrop-blur-sm border border-base-content/5 rounded-xl p-4 w-full max-w-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-base-content/40 uppercase tracking-widest mb-2">
                    <Activity className="w-4 h-4" /> Pulse
                </div>
                <div className="text-center py-4 text-base-content/50 text-sm">
                    No activity yet today
                </div>
            </div>
        );
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Create SVG path
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    const isPositive = percentChange >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-base-100/50 backdrop-blur-sm border border-base-content/5 rounded-xl p-4 w-full max-w-xs"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-base-content/60 uppercase tracking-widest">
                    <Activity className="w-4 h-4 text-pink-500 animate-pulse" /> Pulse
                </div>
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`text-xs font-mono flex items-center gap-1 ${isPositive ? 'text-success' : 'text-error'}`}
                >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{percentChange}% Activity
                </motion.div>
            </div>

            {/* Sparkline Container */}
            <div className="h-16 w-full relative">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`pulseGradient-${communityId}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgb(236, 72, 153)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Fill Area */}
                    <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        d={`M0,100 L${points} L100,100 Z`}
                        fill={`url(#pulseGradient-${communityId})`}
                        stroke="none"
                    />

                    {/* Line */}
                    <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        d={`M${points}`}
                        fill="none"
                        stroke="rgb(236, 72, 153)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* Live Dot */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="absolute right-0 w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgb(236,72,153)]"
                    style={{ top: `${100 - ((data[data.length - 1] - min) / range) * 100}%` }}
                />
                <div
                    className="absolute right-0 w-2.5 h-2.5 rounded-full animate-ping bg-pink-500"
                    style={{ top: `${100 - ((data[data.length - 1] - min) / range) * 100}%` }}
                />
            </div>

            <div className="flex justify-between text-[10px] text-base-content/30 mt-1 font-mono">
                <span>24h ago</span>
                <span>Now</span>
            </div>
        </motion.div>
    );
}

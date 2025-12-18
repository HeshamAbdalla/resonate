'use client';

import Link from 'next/link';
import { LogIn, Github, Chrome, KeyRound, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex text-base-content bg-base-100">

            {/* Left Side - Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />

                <div className="relative z-10 text-center p-12 max-w-lg">
                    <h1 className="text-6xl font-black mb-4 tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                        RESONATE
                    </h1>
                    <p className="text-xl font-bold text-white/60 mb-8">
                        The future of discourse is decentralized, verified, and amplified.
                    </p>
                    <div className="mockup-code bg-base-300 text-base-content w-full shadow-2xl skew-x-1">
                        <pre data-prefix="$"><code>init_sequence --force</code></pre>
                        <pre data-prefix=">" className="text-warning"><code>establishing_uplink...</code></pre>
                        <pre data-prefix=">" className="text-success"><code>identity_verified</code></pre>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-0">

                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h2>
                    <p className="text-base-content/60">Jack in to the grid.</p>
                </div>

                {error && (
                    <div role="alert" className="alert alert-error mb-4 text-sm font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleLogin}>
                    <label className="form-control w-full">
                        <div className="label">
                            <span className="label-text font-bold">Resonate ID / Email</span>
                        </div>
                        <input
                            type="email"
                            placeholder="runner@resonate.net"
                            className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label className="form-control w-full">
                        <div className="label flex justify-between">
                            <span className="label-text font-bold">Passphrase</span>
                            <a href="#" className="label-text-alt link link-primary">Forgot?</a>
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    <button disabled={loading} className="btn btn-primary w-full shadow-lg shadow-primary/20 mt-4 gap-2">
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : <KeyRound className="w-4 h-4" />}
                        {loading ? 'Authenticating...' : 'Jack In'}
                    </button>
                </form>

                <div className="divider my-8 text-xs font-bold opacity-50">OR ACCESS VIA</div>

                <div className="grid grid-cols-2 gap-4">
                    <button type="button" className="btn btn-outline gap-2 hover:bg-base-content hover:text-base-100">
                        <Chrome className="w-4 h-4" />
                        Google
                    </button>
                    <button type="button" className="btn btn-outline gap-2 hover:bg-base-content hover:text-base-100">
                        <Github className="w-4 h-4" />
                        GitHub
                    </button>
                </div>

                <p className="mt-8 text-center text-sm text-base-content/60">
                    First time here? <Link href="/signup" className="link link-primary font-bold">Claim your identity</Link>
                </p>

            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { ArrowRight, Fingerprint, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Redirect to login with success indicator
            router.push('/login?signedUp=true');
        }
    };

    return (
        <div className="min-h-screen flex text-base-content bg-base-100">

            {/* Right Side - Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 order-last relative overflow-hidden bg-primary items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-20 mixed-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-bl from-purple-900/50 to-primary/50" />

                <div className="relative z-10 text-center p-12 max-w-lg text-primary-content">
                    <ShieldCheck className="w-24 h-24 mx-auto mb-6 opacity-80" />
                    <h2 className="text-4xl font-black mb-4">Secure Discourse</h2>
                    <p className="text-lg opacity-80 leading-relaxed">
                        Join 2.4 million thinkers, creators, and innovators building the next layer of the internet.
                    </p>
                </div>
            </div>

            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-0">

                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight mb-2">Initialize Identity</h2>
                    <p className="text-base-content/60">Create your permanent record on the chain.</p>
                </div>

                {error && (
                    <div role="alert" className="alert alert-warning mb-4 text-sm font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSignup}>
                    <label className="form-control w-full">
                        <div className="label">
                            <span className="label-text font-bold">Choose Alias</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="NeonTraveler"
                                className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors pr-10"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            {username.length > 3 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-xs font-bold flex items-center gap-1 animate-in fade-in zoom-in">
                                    <Fingerprint className="w-3 h-3" /> AVAILABLE
                                </div>
                            )}
                        </div>
                        <div className="label">
                            <span className="label-text-alt opacity-50">This will be your unique handle.</span>
                        </div>
                    </label>

                    <label className="form-control w-full">
                        <div className="label">
                            <span className="label-text font-bold">Email Uplink</span>
                        </div>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label className="form-control w-full">
                        <div className="label">
                            <span className="label-text font-bold">Secure String</span>
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="input input-bordered w-full bg-base-200/50 focus:bg-base-100 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </label>

                    <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                            <input type="checkbox" className="checkbox checkbox-primary" required />
                            <span className="label-text text-xs leading-tight opacity-70">
                                I agree to the <a className="link">Resonate Manifesto</a> and accept the responsibilities of open discourse.
                            </span>
                        </label>
                    </div>

                    <button disabled={loading} className="btn btn-secondary w-full shadow-lg shadow-secondary/20 mt-4 gap-2">
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : <ArrowRight className="w-4 h-4" />}
                        {loading ? 'Initializing...' : 'Claim Identity'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-base-content/60">
                    Already verified? <Link href="/login" className="link link-secondary font-bold">Jack in</Link>
                </p>

            </div>
        </div>
    );
}

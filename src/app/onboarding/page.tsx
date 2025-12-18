'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, User, Fingerprint, Globe, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// --- Step Components ---

const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
};

const ManifestoStep = ({ onNext }: { onNext: () => void }) => (
    <motion.div
        variants={stepVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-2xl text-center space-y-8"
    >
        <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
        >
            SIGNAL IN THE NOISE
        </motion.h1>
        <div className="text-xl leading-relaxed opacity-80 space-y-4 text-justify">
            <p>
                The internet lost its way. Algorithms optimize for outrage, not insight.
                Echo chambers amplify the loudest voices, not the wisest.
            </p>
            <p>
                <strong>Resonate is different.</strong> We value <span className="text-primary font-bold">Reputation</span> over virality and <span className="text-secondary font-bold">Resonance</span> over engagement.
            </p>
            <p>
                You are not just a user. You are a node in a decentralized network of thinkers.
                Are you ready to claim your place?
            </p>
        </div>
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="btn btn-primary btn-lg gap-2 mt-8 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
        >
            I Understand <ArrowRight className="w-5 h-5" />
        </motion.button>
    </motion.div>
);

const ProfileStep = ({ onNext, initialUsername }: { onNext: (data: any) => void, initialUsername: string }) => {
    const [bio, setBio] = useState('');
    const [username, setUsername] = useState(initialUsername || '');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);

        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-md w-full space-y-6"
        >
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Establish Identity</h2>
                <p className="opacity-60">How should the network recognize you?</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-2 ${avatarUrl ? 'border-primary' : 'border-base-300 border-dashed'}`}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 opacity-30" />
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                            {uploading ? <span className="loading loading-spinner text-white"></span> : <Upload className="text-white w-8 h-8" />}
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">Handle</span></div>
                    <div className="relative">
                        <input value={username} onChange={e => setUsername(e.target.value)} type="text" className="input input-bordered w-full pr-10 bg-base-200/50" placeholder="NeonDrifter" />
                        <Fingerprint className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
                    </div>
                </label>

                <label className="form-control w-full">
                    <div className="label"><span className="label-text font-bold">Bio Protocol</span></div>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} className="textarea textarea-bordered h-24 bg-base-200/50" placeholder="Tech enthusiast, night owl, seeker of truth..."></textarea>
                </label>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNext({ username, bio, image: avatarUrl })}
                className="btn btn-secondary w-full"
            >
                Confirm Identity <Check className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
};

const DNAStep = ({ onNext }: { onNext: (tags: string[]) => void }) => {
    const TAGS = ["Technology", "Philosophy", "Art", "Science", "Politics", "Gaming", "Music", "History", "Coding", "Space", "AI", "Crypto"];
    const [selected, setSelected] = useState<string[]>([]);

    const toggleTag = (tag: string) => {
        setSelected((prev: string[]) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    return (
        <motion.div
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-lg w-full space-y-6"
        >
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Calibrate Resonance</h2>
                <p className="opacity-60">Select topics to tune your initial feed.</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center py-8">
                {TAGS.map(tag => (
                    <motion.button
                        key={tag}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleTag(tag)}
                        className={`btn btn-sm ${selected.includes(tag) ? 'btn-primary' : 'btn-outline'} transition-all`}
                    >
                        {tag}
                    </motion.button>
                ))}
            </div>

            <div className="alert bg-base-200/50 text-sm border-none shadow-inner">
                <Sparkles className="w-4 h-4 text-warning" />
                <span>Selected {selected.length} signal sources.</span>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNext(selected)}
                disabled={selected.length < 3}
                className="btn btn-accent w-full"
            >
                Initialize Feed <Globe className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
};

// --- Main Wizard Component ---

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) router.push('/login');
            if (user?.user_metadata?.username) {
                setFormData((prev: any) => ({ ...prev, username: user.user_metadata.username }));
            }
        };
        checkUser();
    }, []);

    const handleNext = async (data?: Record<string, any>) => {
        const newData = { ...formData, ...data };
        setFormData(newData);

        if (step === 2) {
            // Final Step - Save to DB
            setIsSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Update User Profile
                const { error } = await supabase
                    .from('users')
                    .update({
                        username: newData.username,
                        bio: newData.bio,
                        image: newData.image,
                        onboardingCompleted: true, // Mark as done!
                        // In a real app we'd save the DNA tags to a standard table too
                    })
                    .eq('id', user.id);

                if (error) {
                    console.error("Profile update failed", error);
                    alert("Failed to save profile. Please try again.");
                    setIsSubmitting(false);
                    return;
                }
            }

            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 2000);
            setStep(step + 1); // Launch
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Animated Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-base-300 z-50">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Wizard Content */}
            <AnimatePresence mode="wait">
                {step === 0 && <ManifestoStep key="step0" onNext={handleNext} />}
                {step === 1 && <ProfileStep key="step1" onNext={handleNext} initialUsername={formData.username} />}
                {step === 2 && <DNAStep key="step2" onNext={handleNext} />}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <div className="loading loading-ring loading-lg text-primary scale-150 mb-6"></div>
                        <h2 className="text-3xl font-black mb-2 animate-pulse">UPLINK ESTABLISHED</h2>
                        <p className="opacity-50">Entering the grid...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step Indicators */}
            {step < 3 && (
                <div className="flex gap-2 mt-12">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className={`h-2 w-2 rounded-full ${i === step ? 'bg-primary' : 'bg-base-300'}`}
                            animate={{ scale: i === step ? 1.2 : 1 }}
                        />
                    ))}
                </div>
            )}

        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Check,
    AlertCircle,
    Loader2,
    Image as ImageIcon,
    Eye,
    Upload,
    X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CreateCommunityPage() {
    const router = useRouter();
    const supabase = createClient();
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState('');
    const [uploading, setUploading] = useState(false);

    // Slug availability
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [slugDebounce, setSlugDebounce] = useState<NodeJS.Timeout | null>(null);

    // Auto-generate slug from name
    useEffect(() => {
        if (name && step === 1) {
            const generatedSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 30);
            setSlug(generatedSlug);
        }
    }, [name, step]);

    // Check slug availability with debounce
    useEffect(() => {
        if (!slug || slug.length < 3) {
            setSlugStatus('idle');
            return;
        }

        setSlugStatus('checking');

        if (slugDebounce) clearTimeout(slugDebounce);

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/communities/check-slug?slug=${encodeURIComponent(slug)}`);
                const data = await res.json();
                setSlugStatus(data.available ? 'available' : 'taken');
            } catch {
                setSlugStatus('idle');
            }
        }, 500);

        setSlugDebounce(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [slug]);

    const canProceedStep1 = name.length >= 3 && slug.length >= 3 && slugStatus === 'available';
    const canProceedStep2 = !uploading; // Can proceed if not uploading

    const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
        setError('');
    };

    const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Icon must be less than 2MB');
            return;
        }
        setIconFile(file);
        setIconPreview(URL.createObjectURL(file));
        setError('');
    };

    const removeBanner = () => {
        setBannerFile(null);
        setBannerPreview('');
        setBannerUrl('');
        if (bannerInputRef.current) {
            bannerInputRef.current.value = '';
        }
    };

    const removeIcon = () => {
        setIconFile(null);
        setIconPreview('');
        if (iconInputRef.current) {
            iconInputRef.current.value = '';
        }
    };

    const handleNext = () => {
        if (step === 1 && canProceedStep1) setStep(2);
        if (step === 2 && canProceedStep2) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleCreate = async () => {
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            let finalBannerUrl = bannerUrl;
            let finalIconUrl = '';
            setUploading(true);

            // Upload banner if file selected
            if (bannerFile) {
                const fileExt = bannerFile.name.split('.').pop();
                const fileName = `${slug}-banner-${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('community-banners')
                    .upload(filePath, bannerFile);

                if (uploadError) {
                    throw new Error('Failed to upload banner: ' + uploadError.message);
                }

                const { data: urlData } = supabase.storage
                    .from('community-banners')
                    .getPublicUrl(filePath);

                finalBannerUrl = urlData.publicUrl;
            }

            // Upload icon if file selected
            if (iconFile) {
                const fileExt = iconFile.name.split('.').pop();
                const fileName = `${slug}-icon-${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('community-banners')
                    .upload(filePath, iconFile);

                if (uploadError) {
                    throw new Error('Failed to upload icon: ' + uploadError.message);
                }

                const { data: urlData } = supabase.storage
                    .from('community-banners')
                    .getPublicUrl(filePath);

                finalIconUrl = urlData.publicUrl;
            }

            setUploading(false);

            const res = await fetch('/api/communities/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    slug,
                    description,
                    bannerImage: finalBannerUrl || null,
                    iconImage: finalIconUrl || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create community');
            }

            // Redirect to the new community
            router.push(`/community/r/${data.slug}`);
        } catch (err: any) {
            setError(err.message);
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
        }),
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black mb-2">Create a Community</h1>
                <p className="text-base-content/60">Build a space for people who share your interests</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                            ? 'bg-primary text-primary-content scale-110'
                            : step > s
                                ? 'bg-success text-success-content'
                                : 'bg-base-300 text-base-content/50'
                            }`}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`w-12 h-1 mx-2 rounded-full transition-colors ${step > s ? 'bg-success' : 'bg-base-300'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
                <div className="card-body p-8">
                    <AnimatePresence mode="wait" custom={step}>
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Basic Information
                                </h2>

                                {/* Name Input */}
                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Community Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Future Technology"
                                        className="input input-bordered w-full"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={50}
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-base-content/50">
                                            {name.length}/50 characters
                                        </span>
                                    </label>
                                </div>

                                {/* Slug Input */}
                                <div className="form-control mb-4">
                                    <label className="label">
                                        <span className="label-text font-bold">Community URL</span>
                                    </label>
                                    <div className="join w-full">
                                        <span className="join-item bg-base-200 flex items-center px-4 text-base-content/60 font-mono text-sm">
                                            r/
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="future-tech"
                                            className="input input-bordered join-item w-full font-mono"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            maxLength={30}
                                        />
                                    </div>
                                    <label className="label">
                                        <span className="label-text-alt flex items-center gap-2">
                                            {slugStatus === 'checking' && (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Checking availability...
                                                </>
                                            )}
                                            {slugStatus === 'available' && (
                                                <span className="text-success flex items-center gap-1">
                                                    <Check className="w-3 h-3" />
                                                    Available!
                                                </span>
                                            )}
                                            {slugStatus === 'taken' && (
                                                <span className="text-error flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Already taken
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                </div>

                                {/* Description */}
                                <div className="form-control mb-6">
                                    <label className="label">
                                        <span className="label-text font-bold">Description</span>
                                        <span className="label-text-alt">Optional</span>
                                    </label>
                                    <textarea
                                        placeholder="What is this community about?"
                                        className="textarea textarea-bordered w-full h-24"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        maxLength={500}
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-base-content/50">
                                            {description.length}/500 characters
                                        </span>
                                    </label>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                    Appearance
                                </h2>

                                {/* Banner Upload */}
                                <div className="form-control mb-6">
                                    <label className="label">
                                        <span className="label-text font-bold">Banner Image</span>
                                        <span className="label-text-alt">Optional</span>
                                    </label>

                                    <input
                                        type="file"
                                        ref={bannerInputRef}
                                        onChange={handleBannerSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {!bannerPreview && !bannerUrl ? (
                                        <div
                                            onClick={() => bannerInputRef.current?.click()}
                                            className="border-2 border-dashed border-base-content/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                                        >
                                            <Upload className="w-12 h-12 mx-auto mb-4 text-base-content/30" />
                                            <p className="font-medium mb-1">Click to upload banner</p>
                                            <p className="text-sm text-base-content/50">PNG, JPG up to 5MB</p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="h-32 rounded-xl overflow-hidden bg-base-200">
                                                <img
                                                    src={bannerPreview || bannerUrl}
                                                    alt="Banner preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeBanner}
                                                className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Icon Upload */}
                                <div className="form-control mb-6">
                                    <label className="label">
                                        <span className="label-text font-bold">Community Icon</span>
                                        <span className="label-text-alt">Optional</span>
                                    </label>

                                    <input
                                        type="file"
                                        ref={iconInputRef}
                                        onChange={handleIconSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    <div className="flex items-center gap-4">
                                        {!iconPreview ? (
                                            <div
                                                onClick={() => iconInputRef.current?.click()}
                                                className="w-20 h-20 border-2 border-dashed border-base-content/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                                            >
                                                <Upload className="w-6 h-6 text-base-content/30" />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-base-200">
                                                    <img
                                                        src={iconPreview}
                                                        alt="Icon preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeIcon}
                                                    className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        <span className="text-sm text-base-content/50">
                                            Square image, up to 2MB
                                        </span>
                                    </div>
                                </div>

                                <div className="alert alert-info">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm">You can update images later in community settings.</span>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={1}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-primary" />
                                    Review & Create
                                </h2>

                                {/* Summary Card */}
                                <div className="bg-base-200/50 rounded-xl p-6 mb-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-content">
                                            {name[0]?.toUpperCase() || 'C'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{name || 'Community Name'}</h3>
                                            <p className="text-base-content/60 font-mono text-sm">r/{slug || 'community-slug'}</p>
                                        </div>
                                    </div>

                                    {description && (
                                        <p className="text-base-content/80 text-sm mb-4">{description}</p>
                                    )}

                                    {(bannerPreview || bannerUrl) && (
                                        <div className="h-24 rounded-lg overflow-hidden bg-base-300">
                                            <img src={bannerPreview || bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-sm text-base-content/60 space-y-2">
                                    <p>• You will be the creator and first member</p>
                                    <p>• You can invite moderators after creation</p>
                                    <p>• Community settings can be changed later</p>
                                </div>

                                {error && (
                                    <div className="alert alert-error mt-4">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-base-content/10">
                        <button
                            className="btn btn-ghost gap-2"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {step < 3 ? (
                            <button
                                className="btn btn-primary gap-2"
                                onClick={handleNext}
                                disabled={step === 1 && !canProceedStep1}
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary gap-2"
                                onClick={handleCreate}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Create Community
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, Loader2, Check, ArrowLeft, ImageIcon, X } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [image, setImage] = useState('');
    const [bannerImage, setBannerImage] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();
                    setName(data.profile.name || '');
                    setBio(data.profile.bio || '');
                    setImage(data.profile.image || '');
                    setBannerImage(data.profile.bannerImage || '');
                    setUsername(data.profile.username);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const uploadFile = async (file: File, type: 'avatar' | 'banner') => {
        const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
        const setUrl = type === 'avatar' ? setImage : setBannerImage;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const res = await fetch('/api/upload/profile', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setUrl(data.url);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to upload image');
            }
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            uploadFile(file, type);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, bio, image, bannerImage }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/profile');
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/profile" className="btn btn-ghost btn-circle">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Edit Profile</h1>
                    <p className="text-base-content/60">@{username}</p>
                </div>
            </div>

            {success ? (
                <div className="bg-base-100 rounded-2xl border border-success/30 p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Profile Updated!</h2>
                    <p className="text-base-content/60">Redirecting to your profile...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Banner */}
                    <div className="card bg-base-100 border border-base-content/10 overflow-hidden">
                        <div className="relative h-36 bg-gradient-to-r from-secondary/20 to-primary/20">
                            {bannerImage && (
                                <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-2">
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'banner')}
                                />
                                <button
                                    type="button"
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={uploadingBanner}
                                    className="btn btn-sm btn-neutral gap-2"
                                >
                                    {uploadingBanner ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4" />
                                    )}
                                    {bannerImage ? 'Change Banner' : 'Upload Banner'}
                                </button>
                                {bannerImage && (
                                    <button
                                        type="button"
                                        onClick={() => setBannerImage('')}
                                        className="btn btn-sm btn-error btn-circle"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6 -mt-16 mb-6">
                                <div className="relative">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-base-100 bg-base-200"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-base-100">
                                            <User className="w-10 h-10 text-primary" />
                                        </div>
                                    )}
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'avatar')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute bottom-0 right-0 btn btn-circle btn-sm btn-primary"
                                    >
                                        {uploadingAvatar ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Camera className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                                <div>
                                    <p className="font-medium">Profile Picture</p>
                                    <p className="text-sm text-base-content/60">
                                        Click the camera to upload a photo
                                    </p>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Display Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Your display name"
                                    className="input input-bordered"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={50}
                                />
                                <label className="label">
                                    <span className="label-text-alt text-base-content/50">
                                        This is how you'll appear to other users
                                    </span>
                                </label>
                            </div>

                            {/* Bio */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Bio</span>
                                    <span className="label-text-alt">{bio.length}/200</span>
                                </label>
                                <textarea
                                    placeholder="Tell us about yourself..."
                                    className="textarea textarea-bordered h-24"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    maxLength={200}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/profile" className="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            disabled={saving || uploadingAvatar || uploadingBanner}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

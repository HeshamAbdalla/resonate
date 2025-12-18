'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Settings,
    X,
    Image as ImageIcon,
    FileText,
    Save,
    Loader2,
    Upload,
    Trash2,
    Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ModeratorManager from './ModeratorManager';

interface CommunitySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    community: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        bannerImage: string | null;
        iconImage: string | null;
        rules: string | null;
    };
    onSave: () => void;
}

export default function CommunitySettingsModal({
    isOpen,
    onClose,
    community,
    onSave
}: CommunitySettingsModalProps) {
    const supabase = createClient();
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'general' | 'rules' | 'moderators'>('general');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState(community.name);
    const [description, setDescription] = useState(community.description || '');
    const [bannerImage, setBannerImage] = useState(community.bannerImage || '');
    const [iconImage, setIconImage] = useState(community.iconImage || '');
    const [rules, setRules] = useState(community.rules || '');

    // File upload state
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState('');

    useEffect(() => {
        // Reset form when modal opens
        if (isOpen) {
            setName(community.name);
            setDescription(community.description || '');
            setBannerImage(community.bannerImage || '');
            setIconImage(community.iconImage || '');
            setRules(community.rules || '');
            setBannerFile(null);
            setBannerPreview('');
            setIconFile(null);
            setIconPreview('');
            setError('');
        }
    }, [isOpen, community]);

    const handleFileSelect = (
        e: React.ChangeEvent<HTMLInputElement>,
        setFile: (f: File | null) => void,
        setPreview: (p: string) => void
    ) => {
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
        setFile(file);
        setPreview(URL.createObjectURL(file));
        setError('');
    };

    const uploadImage = async (file: File, type: 'banner' | 'icon'): Promise<string> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${community.slug}-${type}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage
            .from('community-banners')
            .upload(filePath, file);

        if (error) throw error;

        const { data } = supabase.storage
            .from('community-banners')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            let finalBannerImage = bannerImage;
            let finalIconImage = iconImage;

            // Upload new images if selected
            if (bannerFile) {
                finalBannerImage = await uploadImage(bannerFile, 'banner');
            }
            if (iconFile) {
                finalIconImage = await uploadImage(iconFile, 'icon');
            }

            const res = await fetch(`/api/communities/${community.id}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    bannerImage: finalBannerImage || null,
                    iconImage: finalIconImage || null,
                    rules: rules || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save settings');
            }

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-base-content/10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Community Settings
                    </h2>
                    <button className="btn btn-ghost btn-circle btn-sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-base-content/10">
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'general'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-base-content/60 hover:text-base-content'
                            }`}
                        onClick={() => setActiveTab('general')}
                    >
                        <ImageIcon className="w-4 h-4" />
                        General
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'rules'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-base-content/60 hover:text-base-content'
                            }`}
                        onClick={() => setActiveTab('rules')}
                    >
                        <FileText className="w-4 h-4" />
                        Rules
                    </button>
                    <button
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'moderators'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-base-content/60 hover:text-base-content'
                            }`}
                        onClick={() => setActiveTab('moderators')}
                    >
                        <Shield className="w-4 h-4" />
                        Mods
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Name */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold">Community Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold">Description</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full h-24"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your community..."
                                />
                            </div>

                            {/* Banner Image */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold">Banner Image</span>
                                </label>
                                <input
                                    type="file"
                                    ref={bannerInputRef}
                                    onChange={(e) => handleFileSelect(e, setBannerFile, setBannerPreview)}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {bannerPreview || bannerImage ? (
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-base-200">
                                        <img
                                            src={bannerPreview || bannerImage}
                                            alt="Banner"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                                            onClick={() => {
                                                setBannerFile(null);
                                                setBannerPreview('');
                                                setBannerImage('');
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => bannerInputRef.current?.click()}
                                        className="h-32 border-2 border-dashed border-base-content/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all"
                                    >
                                        <Upload className="w-8 h-8 text-base-content/30" />
                                        <span className="text-sm text-base-content/50">Upload banner</span>
                                    </button>
                                )}
                            </div>

                            {/* Icon Image */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold">Community Icon</span>
                                </label>
                                <input
                                    type="file"
                                    ref={iconInputRef}
                                    onChange={(e) => handleFileSelect(e, setIconFile, setIconPreview)}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <div className="flex items-center gap-4">
                                    {iconPreview || iconImage ? (
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-base-200">
                                                <img
                                                    src={iconPreview || iconImage}
                                                    alt="Icon"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
                                                onClick={() => {
                                                    setIconFile(null);
                                                    setIconPreview('');
                                                    setIconImage('');
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => iconInputRef.current?.click()}
                                            className="w-20 h-20 border-2 border-dashed border-base-content/20 rounded-xl flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all"
                                        >
                                            <Upload className="w-6 h-6 text-base-content/30" />
                                        </button>
                                    )}
                                    <span className="text-sm text-base-content/50">
                                        Square image recommended
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="space-y-4">
                            <p className="text-sm text-base-content/60">
                                Write your community rules in Markdown format. These will be displayed in the community sidebar.
                            </p>
                            <textarea
                                className="textarea textarea-bordered w-full h-64 font-mono text-sm"
                                value={rules}
                                onChange={(e) => setRules(e.target.value)}
                                placeholder={`1. **Be Civil** - Attack ideas, not people.
2. **Stay On Topic** - Keep posts relevant.
3. **No Spam** - Self-promotion will be removed.
4. **Use Flairs** - Tag your posts appropriately.`}
                            />
                            <div className="alert alert-info">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">Markdown formatting is supported. Use **bold**, *italic*, and numbered lists.</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'moderators' && (
                        <ModeratorManager
                            communityId={community.id}
                            isCreator={true}
                            isAdmin={false}
                        />
                    )}

                    {error && (
                        <div className="alert alert-error mt-4">
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-6 border-t border-base-content/10">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary gap-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader2, UserCircle, Camera, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface Profile {
    bio: string;
    specialty: string;
    years_experience: string;
    profile_image: string;
}

interface Props {
    token: string;
    tailorId: number;
    expanded: boolean;
    onExpandedChange: (v: boolean) => void;
    onSaved?: (complete: boolean) => void;
}

export function TailorProfileEditor({ token, tailorId, expanded, onExpandedChange, onSaved }: Props) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<Profile>({
        bio: '', specialty: '', years_experience: '', profile_image: '',
    });
    const [saving,        setSaving]        = useState(false);
    const [saved,         setSaved]         = useState(false);
    const [saveError,     setSaveError]     = useState(false);
    const [uploading,     setUploading]     = useState(false);
    const [uploadError,   setUploadError]   = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/tailors/${tailorId}`)
            .then(r => r.json())
            .then(data => {
                const tailor = data.tailor;
                setProfile({
                    bio:              tailor.bio              ?? '',
                    specialty:        tailor.specialty        ?? '',
                    years_experience: tailor.years_experience != null ? String(tailor.years_experience) : '',
                    profile_image:    tailor.profile_image    ?? '',
                });
            })
            .catch(() => {});
    }, [tailorId]);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/upload/profile-image', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json();
                setUploadError(err.message ?? t('tailorComponents.networkErrorUpload'));
                return;
            }
            const { url } = await res.json();
            setProfile(p => ({ ...p, profile_image: url }));
        } catch {
            setUploadError(t('tailorComponents.networkError'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        setSaveError(false);

        const payload: Record<string, unknown> = {
            bio:           profile.bio       || null,
            specialty:     profile.specialty || null,
            profile_image: profile.profile_image || null,
            years_experience: profile.years_experience !== ''
                ? Number(profile.years_experience)
                : null,
        };

        try {
            const res = await fetch('/api/tailor/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept':        'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                setSaveError(true);
                return;
            }
            setSaved(true);
            onExpandedChange(false);
            onSaved?.(!!profile.bio.trim() && !!profile.specialty.trim());
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setSaveError(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header row */}
            <button
                type="button"
                onClick={() => onExpandedChange(!expanded)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <UserCircle className="w-5 h-5 text-slate-500" />
                    <div>
                        <p className="font-semibold text-slate-900 text-sm">{t('tailorComponents.editProfileTitle')}</p>
                        <p className="text-xs text-slate-400">{t('tailorComponents.editProfileSubtitle')}</p>
                    </div>
                </div>
                <span className="text-slate-400 text-xs">{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <form onSubmit={handleSave} className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-5">
                    {/* Profile photo upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('tailorComponents.profilePhoto')}
                        </label>
                        <div className="flex items-center gap-4">
                            {/* Avatar preview */}
                            <div className="w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {profile.profile_image ? (
                                    <img
                                        src={profile.profile_image}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserCircle className="w-8 h-8 text-slate-400" />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                    id="profile-photo-input"
                                />
                                <label
                                    htmlFor="profile-photo-input"
                                    className={`inline-flex items-center gap-2 border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                                >
                                    {uploading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Camera className="w-4 h-4" />
                                    }
                                    {uploading ? t('tailorComponents.uploading') : t('tailorComponents.choosePhoto')}
                                </label>

                                {profile.profile_image && !uploading && (
                                    <button
                                        type="button"
                                        onClick={() => setProfile(p => ({ ...p, profile_image: '' }))}
                                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        <X className="w-3 h-3" /> {t('tailorComponents.removePhoto')}
                                    </button>
                                )}

                                {uploadError && (
                                    <p className="text-xs text-slate-600">{uploadError}</p>
                                )}

                                <p className="text-xs text-slate-400">{t('tailorComponents.photoFormatHint')}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {t('tailorComponents.bioLabel')}
                        </label>
                        <textarea
                            rows={3}
                            maxLength={1000}
                            value={profile.bio}
                            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                            placeholder={t('tailorComponents.bioPlaceholder')}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 resize-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                {t('tailorComponents.specialtyLabel')}
                            </label>
                            <input
                                type="text"
                                maxLength={200}
                                value={profile.specialty}
                                onChange={e => setProfile(p => ({ ...p, specialty: e.target.value }))}
                                placeholder={t('tailorComponents.specialtyPlaceholder')}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                {t('tailorComponents.yearsExperience')}
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={60}
                                value={profile.years_experience}
                                onChange={e => setProfile(p => ({ ...p, years_experience: e.target.value }))}
                                placeholder={t('tailorComponents.yearsExpPlaceholder')}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <Button
                            variant="default"
                            size="default"
                            type="submit"
                            disabled={saving || uploading}
                            className="flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {saving ? t('tailorComponents.savingProfile') : t('tailorComponents.saveProfileBtn')}
                        </Button>
                        {saved && (
                            <span className="flex items-center gap-1.5 text-sm text-slate-700">
                                <CheckCircle className="w-4 h-4" /> {t('tailorComponents.savedProfile')}
                            </span>
                        )}
                        {saveError && (
                            <span className="text-sm text-slate-600">{t('tailorComponents.saveProfileError')}</span>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

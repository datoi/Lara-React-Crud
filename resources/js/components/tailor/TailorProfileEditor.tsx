import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, UserCircle } from 'lucide-react';

interface Profile {
    bio: string;
    specialty: string;
    years_experience: string;
    profile_image: string;
}

interface Props {
    token: string;
    tailorId: number;
}

export function TailorProfileEditor({ token, tailorId }: Props) {
    const [profile, setProfile] = useState<Profile>({
        bio: '', specialty: '', years_experience: '', profile_image: '',
    });
    const [saving,   setSaving]   = useState(false);
    const [saved,    setSaved]    = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetch(`/api/tailors/${tailorId}`)
            .then(r => r.json())
            .then(data => {
                const t = data.tailor;
                setProfile({
                    bio:              t.bio              ?? '',
                    specialty:        t.specialty        ?? '',
                    years_experience: t.years_experience != null ? String(t.years_experience) : '',
                    profile_image:    t.profile_image    ?? '',
                });
            })
            .catch(() => {});
    }, [tailorId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);

        const payload: Record<string, unknown> = {
            bio:           profile.bio       || null,
            specialty:     profile.specialty || null,
            profile_image: profile.profile_image || null,
            years_experience: profile.years_experience !== ''
                ? Number(profile.years_experience)
                : null,
        };

        try {
            await fetch('/api/tailor/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept':        'application/json',
                },
                body: JSON.stringify(payload),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // silent
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header row */}
            <button
                type="button"
                onClick={() => setExpanded(p => !p)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <UserCircle className="w-5 h-5 text-slate-500" />
                    <div>
                        <p className="font-semibold text-slate-900 text-sm">Edit Profile</p>
                        <p className="text-xs text-slate-400">Bio, specialty, experience, photo</p>
                    </div>
                </div>
                <span className="text-slate-400 text-xs">{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <form onSubmit={handleSave} className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                        <textarea
                            rows={3}
                            maxLength={1000}
                            value={profile.bio}
                            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                            placeholder="Tell customers about yourself, your style, and your craft…"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 resize-none transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialty</label>
                            <input
                                type="text"
                                maxLength={200}
                                value={profile.specialty}
                                onChange={e => setProfile(p => ({ ...p, specialty: e.target.value }))}
                                placeholder="e.g. Traditional Georgian dress"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                            <input
                                type="number"
                                min={0}
                                max={60}
                                value={profile.years_experience}
                                onChange={e => setProfile(p => ({ ...p, years_experience: e.target.value }))}
                                placeholder="e.g. 8"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Photo URL</label>
                        <input
                            type="url"
                            value={profile.profile_image}
                            onChange={e => setProfile(p => ({ ...p, profile_image: e.target.value }))}
                            placeholder="https://…"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {saving ? 'Saving…' : 'Save Profile'}
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1.5 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" /> Saved!
                            </span>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

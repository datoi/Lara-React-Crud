import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Send, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { getAuthUser, getAuthToken } from '../hooks/useAuth';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function EmailSupportModal({ open, onClose }: Props) {
    const { t } = useTranslation();
    const navigate  = useNavigate();
    const user      = getAuthUser();
    const token     = getAuthToken();

    const [subject,     setSubject]     = useState('');
    const [message,     setMessage]     = useState('');
    const [submitting,  setSubmitting]  = useState(false);
    const [sent,        setSent]        = useState(false);
    const [error,       setError]       = useState('');

    if (!open) return null;

    // Redirect to sign in if not logged in
    if (!user || !token) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
                    <p className="text-slate-700 mb-4">{t('emailSupport.signInPrompt')}</p>
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-4 py-2 text-sm"
                        >
                            {t('emailSupport.cancel')}
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => { onClose(); navigate('/login/customer'); }}
                            className="px-4 py-2 text-sm"
                        >
                            {t('emailSupport.signIn')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/support-email', {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept':        'application/json',
                },
                body: JSON.stringify({ subject, message }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message ?? 'Failed to send message.');
            }

            setSent(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSent(false);
        setSubject('');
        setMessage('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">{t('emailSupport.title')}</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="w-8 h-8 text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {sent ? (
                    <div className="px-6 py-10 text-center">
                        <CheckCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="font-semibold text-slate-900 mb-1">{t('emailSupport.sent')}</p>
                        <p className="text-sm text-slate-500">{t('emailSupport.sentHint')} <strong>{user.email}</strong>.</p>
                        <Button
                            variant="default"
                            onClick={handleClose}
                            className="mt-6 px-5 py-2 text-sm"
                        >
                            {t('emailSupport.close')}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        {/* From (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emailSupport.from')}</label>
                            <input
                                type="text"
                                readOnly
                                value={`${user.first_name} ${user.last_name} <${user.email}>`}
                                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emailSupport.subject')}</label>
                            <input
                                type="text"
                                required
                                maxLength={255}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
                                placeholder="What can we help with?"
                            />
                        </div>
                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('emailSupport.message')}</label>
                            <textarea
                                required
                                rows={5}
                                maxLength={5000}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-500 transition-colors resize-none"
                                placeholder="Describe your issue or question…"
                            />
                        </div>

                        {error && <p className="text-sm text-slate-600">{error}</p>}

                        <div className="flex gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 text-sm font-medium py-2.5"
                            >
                                {t('emailSupport.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5"
                            >
                                {submitting ? t('emailSupport.sending') : <><Send className="w-4 h-4" /> {t('emailSupport.sendMessage')}</>}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Send, CheckCircle } from 'lucide-react';
import { getAuthUser, getAuthToken } from '../hooks/useAuth';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function EmailSupportModal({ open, onClose }: Props) {
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
                    <p className="text-slate-700 mb-4">Please sign in to contact support.</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onClose(); navigate('/signin'); }}
                            className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Sign In
                        </button>
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
                    <h2 className="text-lg font-bold text-slate-900">Email Support</h2>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {sent ? (
                    <div className="px-6 py-10 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="font-semibold text-slate-900 mb-1">Message Sent!</p>
                        <p className="text-sm text-slate-500">We'll respond within 24 hours to <strong>{user.email}</strong>.</p>
                        <button
                            onClick={handleClose}
                            className="mt-6 px-5 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        {/* From (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">From</label>
                            <input
                                type="text"
                                readOnly
                                value={`${user.first_name} ${user.last_name} <${user.email}>`}
                                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
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

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 border border-slate-300 text-slate-700 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60"
                            >
                                {submitting ? 'Sending…' : <><Send className="w-4 h-4" /> Send Message</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import type { DesignConfiguration } from '../../types/customizer';
import { getAuthToken } from '../../hooks/useAuth';

interface SaveDesignModalProps {
    open: boolean;
    onClose: () => void;
    productId: number;
    configuration: DesignConfiguration;
    onSaved?: (name: string) => void;
}

export default function SaveDesignModal({
    open,
    onClose,
    productId,
    configuration,
    onSaved,
}: SaveDesignModalProps) {
    const [name, setName]     = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Please give your design a name.');
            return;
        }
        const token = getAuthToken();
        if (!token) {
            setError('You must be signed in to save designs.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/customizer/designs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    name: name.trim(),
                    configuration,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message ?? 'Save failed.');
            }
            onSaved?.(name.trim());
            setName('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.25 }}
                        className="relative z-10 bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-lg font-bold text-slate-900 mb-1">Save Design</h2>
                        <p className="text-sm text-slate-500 mb-5">
                            Give your configuration a name so you can find it later.
                        </p>

                        <label htmlFor="design-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Design name
                        </label>
                        <input
                            id="design-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            placeholder="e.g. Navy spread-collar"
                            maxLength={120}
                            autoFocus
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
                        />

                        {error && (
                            <p className="text-xs text-slate-600 mb-3">{error}</p>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="default"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                size="default"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

import { RefreshCw } from 'lucide-react';

interface Props {
    message?: string;
    onRetry?: () => void;
}

export function ErrorFallback({ message = 'Failed to load data.', onRetry }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-slate-500 text-sm mb-4">{message} Please try again.</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 text-sm font-medium border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            )}
        </div>
    );
}

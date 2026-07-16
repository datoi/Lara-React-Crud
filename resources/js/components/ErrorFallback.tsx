import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

interface Props {
    message?: string;
    onRetry?: () => void;
}

export function ErrorFallback({ message = 'Failed to load data.', onRetry }: Props) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-destructive text-sm mb-4">{message} {t('errorFallback.hint')}</p>
            {onRetry && (
                <Button
                    variant="default"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t('errorFallback.retry')}
                </Button>
            )}
        </div>
    );
}

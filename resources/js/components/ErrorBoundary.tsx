import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import i18n from '../i18n';
import { Button } from './ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                        <AlertTriangle className="w-7 h-7 text-slate-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">{i18n.t('errorBoundary.title')}</h1>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">
                        {i18n.t('errorBoundary.desc')}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        {i18n.t('errorBoundary.retry')}
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

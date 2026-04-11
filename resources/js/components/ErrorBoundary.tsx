import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm">
                        An unexpected error occurred. Please try reloading the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

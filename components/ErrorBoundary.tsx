// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console
        console.error('[ErrorBoundary] Caught an error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);

        this.setState({ errorInfo });

        // Optional: Send to error tracking service (Sentry, etc.)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //   window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                    <div className="bento-card max-w-lg w-full p-8 text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-red/20 flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-accent-red"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-4 text-accent-red">
                            Đã Xảy Ra Lỗi
                        </h2>

                        <p className="text-text-secondary mb-6">
                            Ứng dụng gặp sự cố không mong muốn. Đội ngũ kỹ thuật đã được thông báo.
                        </p>

                        {/* Error details (only in development) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-text-secondary hover:text-white transition-colors">
                                    Chi tiết lỗi (Development)
                                </summary>
                                <pre className="mt-2 p-4 bg-black/50 rounded-lg text-xs text-accent-red overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-3 bg-accent-primary text-black font-bold rounded-lg hover:bg-accent-primary/80 transition-colors"
                            >
                                Thử Lại
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors"
                            >
                                Tải Lại Trang
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

// tests/components/ErrorBoundary.test.tsx
/**
 * Tests for ErrorBoundary component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
}

describe('ErrorBoundary', () => {
    // Suppress console.error for error boundary tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    afterEach(() => {
        consoleSpy.mockClear();
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>Test child</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Test child')).toBeInTheDocument();
    });

    it('renders fallback UI when there is an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Đã Xảy Ra Lỗi')).toBeInTheDocument();
        expect(screen.getByText('Thử Lại')).toBeInTheDocument();
        expect(screen.getByText('Tải Lại Trang')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom fallback</div>}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('logs error to console when error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(consoleSpy).toHaveBeenCalled();
        const errorCall = consoleSpy.mock.calls.find(
            call => call[0] === '[ErrorBoundary] Caught an error:'
        );
        expect(errorCall).toBeDefined();
    });

    it('resets error state when retry button is clicked', () => {
        // Create a stateful test component
        let shouldThrow = true;

        const TestChild = () => {
            if (shouldThrow) {
                throw new Error('Test error');
            }
            return <div data-testid="success">No error</div>;
        };

        const { rerender } = render(
            <ErrorBoundary>
                <TestChild />
            </ErrorBoundary>
        );

        // Should show error UI
        expect(screen.getByText('Đã Xảy Ra Lỗi')).toBeInTheDocument();

        // Change the flag before clicking retry
        shouldThrow = false;

        // Click retry button
        fireEvent.click(screen.getByText('Thử Lại'));

        // Rerender the component with same ErrorBoundary
        rerender(
            <ErrorBoundary>
                <TestChild />
            </ErrorBoundary>
        );

        // After retry, the error boundary should have reset
        // and now render the child successfully
        expect(screen.getByTestId('success')).toBeInTheDocument();
        expect(screen.getByText('No error')).toBeInTheDocument();
    });
});

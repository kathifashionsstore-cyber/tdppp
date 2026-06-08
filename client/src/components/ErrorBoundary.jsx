import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error('Route render failed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-page grid min-h-[50vh] place-items-center py-16 text-center">
          <div className="max-w-xl rounded-lg border border-red-100 bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-black text-slate-950">Something went wrong</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{this.state.error?.message || 'This page could not render correctly.'}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-tdp-red px-5 py-3 font-black text-white">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

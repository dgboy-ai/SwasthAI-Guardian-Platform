import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 lg:p-5 text-left">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <p className="font-black text-slate-700 text-sm">View crashed unexpectedly</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1 mb-5 max-w-sm mx-auto">
              {this.state.error?.message || 'An unexpected error occurred in this view.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

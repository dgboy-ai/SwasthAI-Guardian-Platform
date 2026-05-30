import { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-inter selection:bg-emerald-100">
          <div className="bg-white/70 backdrop-blur-2xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-8 sm:p-12 max-w-md w-full relative overflow-hidden">
            
            {/* Top illustrative icon with premium glow */}
            <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/5 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
              System Recovery Mode
            </h2>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4">
              Error Isolated & Handled Safely
            </p>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-8">
              A runtime component exception was safely caught. Your health data and offline queues remain protected.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reload App
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="flex-1 py-3 px-5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Home className="w-3.5 h-3.5" /> Go Home
              </button>
            </div>
            
            {this.state.error?.message && (
              <div className="mt-8 pt-6 border-t border-slate-100 text-left">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Developer Context</p>
                <code className="block bg-slate-50 p-3 rounded-xl border border-slate-150 font-mono text-[9px] text-slate-500 overflow-x-auto whitespace-pre-wrap break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

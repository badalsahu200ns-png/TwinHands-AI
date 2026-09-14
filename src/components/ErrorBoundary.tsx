/**
 * TwinHands-AI: Robust Error Boundary & Recovery Interface
 * Catches any unhandled React or WebGL rendering exceptions and displays
 * a sleek recovery panel instead of an uninformative black screen.
 */

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[TwinHands-AI] Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[480px] p-6 bg-slate-950/95 border border-rose-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-mono tracking-wide">
              {this.props.fallbackTitle || '3D Workspace Rendering Exception'}
            </h3>
            <p className="text-xs text-rose-300 font-mono max-w-md mx-auto">
              {this.state.error?.message || 'A WebGL or state synchronization issue was encountered.'}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RECOVER & RELOAD VIEWPORT</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono border border-slate-700 transition-all"
            >
              FULL PAGE REFRESH
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    isChunkError: false
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || '';
    const isChunk = 
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Importing a module script failed') ||
      msg.includes("Unexpected token '<'") || // Returned 404 HTML instead of JS
      msg.includes('error loading dynamically imported module');

    return {
      hasError: true,
      error,
      isChunkError: isChunk
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Trends Box Error Boundary]', error, errorInfo);

    // If it's a chunk/deployment mismatch error, try automatic reload once
    const msg = error?.message || '';
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes("Unexpected token '<'")
    ) {
      const hasAutoReloaded = sessionStorage.getItem('auto_reloaded_for_chunk');
      if (!hasAutoReloaded) {
        sessionStorage.setItem('auto_reloaded_for_chunk', 'true');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('auto_reloaded_for_chunk');
    window.location.reload();
  };

  handleHardReset = async () => {
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 md:p-8 border border-black/5 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                {this.state.isChunkError ? 'New Update Available' : 'Something went wrong'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                {this.state.isChunkError
                  ? 'A new deployment has been published. Please reload to fetch the latest version.'
                  : 'Trends Box encountered a temporary loading error. Reloading will restore your workspace.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <RefreshCw size={15} />
                <span>Reload Trends Box</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full py-2.5 px-4 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw size={13} />
                <span>Clear Cache &amp; Refresh</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

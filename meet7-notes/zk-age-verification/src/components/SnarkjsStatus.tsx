import { useState, useEffect, useCallback } from 'react';
import { SnarkjsLoader } from '../lib/snarkjsLoader';

interface SnarkjsStatusProps {
  onLoadingChange?: (isLoading: boolean) => void;
  onStatusChange?: (isLoaded: boolean) => void;
  showDetailedStatus?: boolean;
}

export default function SnarkjsStatus({ 
  onLoadingChange, 
  onStatusChange,
  showDetailedStatus = false 
}: SnarkjsStatusProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkAndLoadSnarkjs = useCallback(async () => {
    // Check if already loaded
    if (SnarkjsLoader.isLoaded()) {
      setIsLoaded(true);
      onStatusChange?.(true);
      return;
    }

    setIsLoading(true);
    onLoadingChange?.(true);
    setError(null);

    try {
      await SnarkjsLoader.preload(3);
      setIsLoaded(true);
      setError(null);
      onStatusChange?.(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load SnarkJS';
      setError(errorMsg);
      setIsLoaded(false);
      onStatusChange?.(false);
      console.error('SnarkJS loading failed:', err);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  }, [onLoadingChange, onStatusChange]);

  useEffect(() => {
    checkAndLoadSnarkjs();
    
    // Listen for snarkjs-loaded event from preloader
    const handleSnarkjsLoaded = () => {
      console.log('SnarkJS loaded via preloader');
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
      onStatusChange?.(true);
      onLoadingChange?.(false);
    };

    window.addEventListener('snarkjs-loaded', handleSnarkjsLoaded);
    
    return () => {
      window.removeEventListener('snarkjs-loaded', handleSnarkjsLoaded);
    };
  }, [checkAndLoadSnarkjs, onLoadingChange, onStatusChange]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await checkAndLoadSnarkjs();
  };

  const handleForceReload = async () => {
    setIsLoading(true);
    onLoadingChange?.(true);
    setError(null);

    try {
      await SnarkjsLoader.reload();
      setIsLoaded(true);
      setError(null);
      onStatusChange?.(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reload SnarkJS';
      setError(errorMsg);
      setIsLoaded(false);
      onStatusChange?.(false);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  if (!showDetailedStatus && isLoaded) {
    return null; // Don't show anything if loaded and not showing detailed status
  }

  return (
    <div className="w-full">
      {/* Loading State */}
      {isLoading && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
            <div>
              <p className="text-blue-400 font-medium">Loading ZK Proof System</p>
              <p className="text-blue-300 text-sm">
                Setting up cryptographic libraries...
                {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {isLoaded && !isLoading && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-green-400 text-xl">✅</div>
            <div>
              <p className="text-green-400 font-medium">ZK Proof System Ready</p>
              {showDetailedStatus && (
                <p className="text-green-300 text-sm">
                  SnarkJS version: {SnarkjsLoader.getVersion() || 'Unknown'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-red-400 text-xl">⚠️</div>
              <div>
                <p className="text-red-400 font-medium">ZK Proof System Error</p>
                <p className="text-red-300 text-sm mb-2">{error}</p>
                {showDetailedStatus && (
                  <p className="text-red-200 text-xs">
                    Some features may work with fallback methods, but full ZK proof generation requires this system.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleRetry}
                className="px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
              {showDetailedStatus && (
                <button
                  onClick={handleForceReload}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                >
                  Force Reload
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Status */}
      {showDetailedStatus && (
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>SnarkJS Status:</span>
            <span className={isLoaded ? 'text-green-400' : 'text-red-400'}>
              {isLoaded ? 'Loaded' : 'Not Loaded'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Browser Support:</span>
            <span className="text-green-400">
              {typeof window !== 'undefined' && window.crypto ? 'Yes' : 'No'}
            </span>
          </div>
          {retryCount > 0 && (
            <div className="flex justify-between">
              <span>Retry Attempts:</span>
              <span className="text-yellow-400">{retryCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
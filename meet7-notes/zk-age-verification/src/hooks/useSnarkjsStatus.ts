import { useState, useEffect } from 'react';
import { SnarkjsLoader } from '../lib/snarkjsLoader';

// Hook for using SnarkJS status
export function useSnarkjsStatus() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const supported = SnarkjsLoader.isLoaded();
        setIsLoaded(supported);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await SnarkjsLoader.reload();
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reload failed');
      setIsLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoaded,
    isLoading,
    error,
    reload
  };
}

// Hook for circuit status
export function useCircuitStatus() {
  const [hasCircuit, setHasCircuit] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkCircuit = async () => {
      setIsChecking(true);
      try {
        const wasmResponse = await fetch('/circuits/build/ageVerification_js/ageVerification.wasm', { method: 'HEAD' });
        const zkeyResponse = await fetch('/circuits/build/ageVerification_0001.zkey', { method: 'HEAD' });
        const vkeyResponse = await fetch('/circuits/build/verification_key.json', { method: 'HEAD' });
        
        const hasAll = wasmResponse.ok && zkeyResponse.ok && vkeyResponse.ok;
        setHasCircuit(hasAll);
      } catch {
        setHasCircuit(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkCircuit();
  }, []);

  return { hasCircuit, isChecking };
}
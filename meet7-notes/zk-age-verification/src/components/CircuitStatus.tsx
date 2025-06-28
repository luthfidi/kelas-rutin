import { useState, useEffect, useCallback } from 'react';

interface CircuitStatusProps {
  onStatusChange?: (hasCircuit: boolean) => void;
}

interface CircuitFiles {
  wasm: boolean;
  zkey: boolean;
  vkey: boolean;
}

export default function CircuitStatus({ onStatusChange }: CircuitStatusProps) {
  const [circuitFiles, setCircuitFiles] = useState<CircuitFiles>({
    wasm: false,
    zkey: false,
    vkey: false
  });
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkCircuitFiles = useCallback(async () => {
    setIsChecking(true);
    
    const files = {
      wasm: false,
      zkey: false,
      vkey: false
    };

    try {
      // Check WASM file - update path
      try {
        const wasmResponse = await fetch('/circuits/build/ageVerification_js/ageVerification.wasm', { method: 'HEAD' });
        files.wasm = wasmResponse.ok;
      } catch {
        files.wasm = false;
      }

      // Check zkey file - update path
      try {
        const zkeyResponse = await fetch('/circuits/build/ageVerification_0001.zkey', { method: 'HEAD' });
        files.zkey = zkeyResponse.ok;
      } catch {
        files.zkey = false;
      }

      // Check verification key - update path
      try {
        const vkeyResponse = await fetch('/circuits/build/verification_key.json', { method: 'HEAD' });
        files.vkey = vkeyResponse.ok;
      } catch {
        files.vkey = false;
      }

      setCircuitFiles(files);
      setLastChecked(new Date());
      
      // Notify parent about circuit availability
      const hasAllFiles = files.wasm && files.zkey && files.vkey;
      onStatusChange?.(hasAllFiles);
      
    } catch (error) {
      console.error('Error checking circuit files:', error);
    } finally {
      setIsChecking(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    checkCircuitFiles();
  }, [checkCircuitFiles]);

  const hasAnyFiles = circuitFiles.wasm || circuitFiles.zkey || circuitFiles.vkey;
  const hasAllFiles = circuitFiles.wasm && circuitFiles.zkey && circuitFiles.vkey;

  if (isChecking) {
    return (
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="text-blue-400 text-sm">Checking circuit availability...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {hasAllFiles ? (
        // All circuit files available
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-green-400 text-lg">🟢</div>
              <div>
                <p className="text-green-400 font-medium">Real ZK Circuit Available</p>
                <p className="text-green-300 text-sm">Full zero-knowledge proof generation enabled</p>
              </div>
            </div>
            <button
              onClick={checkCircuitFiles}
              className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition-colors"
            >
              Recheck
            </button>
          </div>
        </div>
      ) : hasAnyFiles ? (
        // Some files missing
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-yellow-400 text-lg">🟡</div>
              <div>
                <p className="text-yellow-400 font-medium">Incomplete Circuit Setup</p>
                <p className="text-yellow-300 text-sm">Some circuit files are missing - using fallback</p>
              </div>
            </div>
            <button
              onClick={checkCircuitFiles}
              className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 transition-colors"
            >
              Recheck
            </button>
          </div>
          
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded ${circuitFiles.wasm ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {circuitFiles.wasm ? '✓' : '✗'} WASM File
            </div>
            <div className={`p-2 rounded ${circuitFiles.zkey ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {circuitFiles.zkey ? '✓' : '✗'} Proving Key
            </div>
            <div className={`p-2 rounded ${circuitFiles.vkey ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {circuitFiles.vkey ? '✓' : '✗'} Verification Key
            </div>
          </div>
        </div>
      ) : (
        // No circuit files
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-orange-400 text-lg">🔶</div>
              <div>
                <p className="text-orange-400 font-medium">Demo Mode - Mock Proofs Only</p>
                <p className="text-orange-300 text-sm">
                  Circuit files not found - using mock proofs for demonstration
                </p>
              </div>
            </div>
            <button
              onClick={checkCircuitFiles}
              className="px-3 py-1 text-xs bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 transition-colors"
            >
              Recheck
            </button>
          </div>
          
          <div className="mt-3 p-3 bg-orange-900/20 rounded text-xs text-orange-200">
            <p className="font-medium mb-1">📁 Expected Circuit Files:</p>
            <ul className="space-y-1 text-orange-300">
              <li>• <code>/public/circuits/build/ageVerification_js/ageVerification.wasm</code></li>
              <li>• <code>/public/circuits/build/ageVerification_0001.zkey</code></li>
              <li>• <code>/public/circuits/build/verification_key.json</code></li>
            </ul>
          </div>
        </div>
      )}
      
      {lastChecked && (
        <div className="mt-2 text-xs text-gray-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
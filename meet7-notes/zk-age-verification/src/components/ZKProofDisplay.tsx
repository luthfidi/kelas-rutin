"use client"

import { useState } from "react"
import { CheckCircle, Copy, ExternalLink, Eye, EyeOff, AlertTriangle } from "lucide-react"
import type { AgeProofOutput } from "../types/ktp"

interface ZKProofDisplayProps {
  proof: AgeProofOutput;
  isAdult: boolean;
  commitment: string;
  onVerifyOnChain: () => void;
  isVerifying?: boolean;
  verificationTx?: string;
}

const ZKProofDisplay = ({ 
  proof, 
  isAdult, 
  commitment, 
  onVerifyOnChain, 
  isVerifying = false,
  verificationTx 
}: ZKProofDisplayProps) => {
  const [showFullProof, setShowFullProof] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const truncateProof = (proofArray: string[], maxLength = 20) => {
    return proofArray.map(item => 
      item.length > maxLength ? `${item.slice(0, maxLength)}...` : item
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Proof Result */}
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isAdult ? 'glow-success' : ''
          }`} style={{
            backgroundColor: isAdult ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
            border: `2px solid ${isAdult ? "#10B981" : "#EF4444"}`
          }}>
            {isAdult ? (
              <CheckCircle className="w-8 h-8" style={{ color: "#10B981" }} />
            ) : (
              <AlertTriangle className="w-8 h-8" style={{ color: "#EF4444" }} />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: "#FBFAF9" }}>
            {isAdult ? "✅ Age Verification Successful" : "❌ Age Verification Failed"}
          </h2>
          
          <p className="text-lg" style={{ 
            color: isAdult ? "#10B981" : "#EF4444"
          }}>
            {isAdult 
              ? "Zero-knowledge proof confirms: Age ≥ 18 years"
              : "Zero-knowledge proof result: Age < 18 years"
            }
          </p>

          <div className="mt-4 text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            🔐 No personal information was revealed during this verification
          </div>
        </div>

        {/* Proof Details */}
        <div className="space-y-4">
          {/* Commitment Hash */}
          <div className="p-4 rounded-xl border" style={{
            backgroundColor: "rgba(131, 110, 249, 0.1)",
            borderColor: "rgba(131, 110, 249, 0.3)"
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold" style={{ color: "#FBFAF9" }}>
                Privacy Commitment
              </span>
              <button
                onClick={() => copyToClipboard(commitment, 'commitment')}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: "rgba(251, 250, 249, 0.7)" }}
              >
                {copiedField === 'commitment' ? (
                  <CheckCircle className="w-4 h-4" style={{ color: "#10B981" }} />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="font-mono text-sm break-all" style={{ color: "#836EF9" }}>
              {commitment}
            </div>
            <div className="text-xs mt-2" style={{ color: "rgba(251, 250, 249, 0.6)" }}>
              Cryptographic commitment untuk prevent replay attacks
            </div>
          </div>

          {/* ZK Proof Data */}
          <div className="p-4 rounded-xl border" style={{
            backgroundColor: "rgba(14, 16, 15, 0.3)",
            borderColor: "rgba(251, 250, 249, 0.1)"
          }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold" style={{ color: "#FBFAF9" }}>
                Zero-Knowledge Proof
              </span>
              <button
                onClick={() => setShowFullProof(!showFullProof)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-200 hover:bg-white/10"
                style={{
                  backgroundColor: "rgba(14, 16, 15, 0.3)",
                  borderColor: "rgba(251, 250, 249, 0.2)",
                  color: "rgba(251, 250, 249, 0.7)"
                }}
              >
                {showFullProof ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span className="text-sm">Hide Full Proof</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Show Full Proof</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {/* Proof Components */}
              <div>
                <div className="text-sm font-medium mb-2" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
                  Proof π_a:
                </div>
                <div className="font-mono text-xs break-all p-2 rounded border" style={{
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: "rgba(251, 250, 249, 0.1)",
                  color: "#A0055D"
                }}>
                  {showFullProof 
                    ? `[${proof.proof.pi_a.join(', ')}]`
                    : `[${truncateProof(proof.proof.pi_a).join(', ')}]`
                  }
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
                  Proof π_b:
                </div>
                <div className="font-mono text-xs break-all p-2 rounded border" style={{
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: "rgba(251, 250, 249, 0.1)",
                  color: "#A0055D"
                }}>
                  {showFullProof 
                    ? `[[${proof.proof.pi_b[0].join(', ')}], [${proof.proof.pi_b[1].join(', ')}]]`
                    : `[[${truncateProof(proof.proof.pi_b[0]).join(', ')}], [${truncateProof(proof.proof.pi_b[1]).join(', ')}]]`
                  }
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
                  Proof π_c:
                </div>
                <div className="font-mono text-xs break-all p-2 rounded border" style={{
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: "rgba(251, 250, 249, 0.1)",
                  color: "#A0055D"
                }}>
                  {showFullProof 
                    ? `[${proof.proof.pi_c.join(', ')}]`
                    : `[${truncateProof(proof.proof.pi_c).join(', ')}]`
                  }
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
                  Public Signals:
                </div>
                <div className="font-mono text-xs break-all p-2 rounded border" style={{
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: "rgba(251, 250, 249, 0.1)",
                  color: "#10B981"
                }}>
                  [{proof.publicSignals.join(', ')}]
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs" style={{ color: "rgba(251, 250, 249, 0.6)" }}>
              📊 Groth16 zero-knowledge proof that can be verified on-chain
            </div>
          </div>
        </div>

        {/* On-chain Verification */}
        {isAdult && (
          <div className="mt-6">
            <button
              onClick={onVerifyOnChain}
              disabled={isVerifying}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
              style={{
                background: isVerifying 
                  ? "rgba(131, 110, 249, 0.3)" 
                  : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#FBFAF9"
              }}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Verifying On-Chain...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Verify on Monad Blockchain</span>
                </div>
              )}
            </button>

            {verificationTx && (
              <div className="mt-4 p-4 rounded-xl border" style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.3)"
              }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: "#10B981" }}>
                    ✅ Verified on Blockchain
                  </span>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${verificationTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    style={{ color: "#10B981" }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-sm mt-2 font-mono break-all" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
                  TX: {verificationTx}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Technical Details */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="font-semibold mb-4" style={{ color: "#FBFAF9" }}>
            📋 Technical Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Proof System:</span>
                <span style={{ color: "#FBFAF9" }}>Groth16</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Circuit:</span>
                <span style={{ color: "#FBFAF9" }}>Age Verification</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Curve:</span>
                <span style={{ color: "#FBFAF9" }}>BN128</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Proof Size:</span>
                <span style={{ color: "#FBFAF9" }}>~256 bytes</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Verification:</span>
                <span style={{ color: "#FBFAF9" }}>Constant time</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Gas Cost:</span>
                <span style={{ color: "#FBFAF9" }}>~150k gas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#FBFAF9" }}>
          🔒 Privacy Guarantees
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3" style={{ color: "#10B981" }}>
              ✅ What is Proven
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
              <li>• Age is greater than or equal to 18 years</li>
              <li>• Proof came from valid KTP data</li>
              <li>• Prover knows the birth date</li>
              <li>• Commitment prevents replay attacks</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3" style={{ color: "#EF4444" }}>
              ❌ What is NOT Revealed
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
              <li>• Exact birth date or age</li>
              <li>• Name, NIK, or other personal data</li>
              <li>• Address or location information</li>
              <li>• Any identifying information</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl border" style={{
          backgroundColor: "rgba(131, 110, 249, 0.1)",
          borderColor: "rgba(131, 110, 249, 0.3)"
        }}>
          <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
            <strong style={{ color: "#836EF9" }}>Zero-Knowledge Property:</strong> This proof is mathematically guaranteed to reveal nothing beyond the fact that your age ≥ 18. Even with quantum computers, no additional information can be extracted from this proof.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ZKProofDisplay
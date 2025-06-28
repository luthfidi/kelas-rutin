"use client"

import { useState } from "react"
import { FileText, Eye, EyeOff, Shield, AlertCircle } from "lucide-react"
import type { KTPData } from "../types/ktp"
import { maskKTPData } from "../lib/zkProof"

interface KTPInputFormProps {
  onSubmit: (ktpData: KTPData) => void;
  isLoading?: boolean;
}

const KTPInputForm = ({ onSubmit, isLoading = false }: KTPInputFormProps) => {
  const [ktpData, setKTPData] = useState<KTPData>({
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    alamat: '',
    rt: '',
    rw: '',
    kelurahan: '',
    kecamatan: '',
    agama: '',
    statusPerkawinan: '',
    pekerjaan: '',
    kewarganegaraan: 'WNI',
    berlakuHingga: 'SEUMUR HIDUP'
  })

  const [showFullData, setShowFullData] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sample KTP data untuk demo
  const sampleKTP: KTPData = {
    nik: '3171012501950001',
    nama: 'BUDI SANTOSO',
    tempatLahir: 'JAKARTA',
    tanggalLahir: '25-01-1995',
    jenisKelamin: 'LAKI-LAKI',
    alamat: 'JL. SUDIRMAN NO. 123',
    rt: '001',
    rw: '002',
    kelurahan: 'MENTENG',
    kecamatan: 'MENTENG',
    agama: 'ISLAM',
    statusPerkawinan: 'BELUM KAWIN',
    pekerjaan: 'SOFTWARE ENGINEER',
    kewarganegaraan: 'WNI',
    berlakuHingga: 'SEUMUR HIDUP'
  }

  const validateKTP = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate NIK (16 digits)
    if (!ktpData.nik || ktpData.nik.length !== 16) {
      newErrors.nik = 'NIK harus 16 digit'
    }

    // Validate tanggal lahir format DD-MM-YYYY
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/
    if (!ktpData.tanggalLahir || !dateRegex.test(ktpData.tanggalLahir)) {
      newErrors.tanggalLahir = 'Format tanggal: DD-MM-YYYY'
    } else {
      const [day, month, year] = ktpData.tanggalLahir.split('-').map(Number)
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2010) {
        newErrors.tanggalLahir = 'Tanggal lahir tidak valid'
      }
    }

    // Required fields
    const requiredFields = ['nama', 'tempatLahir', 'jenisKelamin']
    requiredFields.forEach(field => {
      if (!ktpData[field as keyof KTPData]) {
        newErrors[field] = 'Field ini wajib diisi'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateKTP()) {
      onSubmit(ktpData)
    }
  }

  const loadSampleData = () => {
    setKTPData(sampleKTP)
    setErrors({})
  }

  const displayValue = (value: string, field: string) => {
    if (!showFullData && ['nik', 'nama', 'alamat'].includes(field)) {
      return maskKTPData(value, 4)
    }
    return value
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl border" style={{
            backgroundColor: "rgba(131, 110, 249, 0.1)",
            borderColor: "rgba(131, 110, 249, 0.3)"
          }}>
            <FileText className="w-6 h-6" style={{ color: "#836EF9" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#FBFAF9" }}>
              Input Data KTP Indonesia
            </h2>
            <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              Data akan digunakan untuk generate ZK proof umur {'>'}= 18 tahun
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl border mb-6" style={{
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderColor: "rgba(16, 185, 129, 0.3)"
        }}>
          <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#10B981" }} />
          <div>
            <h3 className="font-semibold mb-1" style={{ color: "#10B981" }}>
              🔒 Privacy Guarantee
            </h3>
            <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
              Data KTP tidak akan disimpan atau dibagikan. Hanya proof matematis "umur {'>'}= 18" yang akan di-generate tanpa mengungkapkan informasi personal.
            </p>
          </div>
        </div>

        {/* Sample Data Button */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 rounded-lg border font-medium transition-all duration-200 hover:bg-white/10"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              borderColor: "rgba(245, 158, 11, 0.3)",
              color: "#F59E0B"
            }}
          >
            📝 Load Sample KTP Data
          </button>

          <button
            onClick={() => setShowFullData(!showFullData)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:bg-white/10"
            style={{
              backgroundColor: "rgba(14, 16, 15, 0.3)",
              borderColor: "rgba(251, 250, 249, 0.2)",
              color: "rgba(251, 250, 249, 0.7)"
            }}
          >
            {showFullData ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="text-sm">Hide Data</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="text-sm">Show Full Data</span>
              </>
            )}
          </button>
        </div>

        {/* KTP Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NIK */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#FBFAF9" }}>
              NIK (16 digit) *
            </label>
            <input
              type="text"
              value={displayValue(ktpData.nik, 'nik')}
              onChange={(e) => setKTPData({ ...ktpData, nik: e.target.value })}
              placeholder="3171012501950001"
              maxLength={16}
              className="w-full px-4 py-3 rounded-lg border input-primary"
              style={{
                backgroundColor: "rgba(14, 16, 15, 0.5)",
                borderColor: errors.nik ? "#EF4444" : "rgba(251, 250, 249, 0.2)",
                color: "#FBFAF9"
              }}
            />
            {errors.nik && (
              <p className="text-sm mt-1 flex items-center gap-1" style={{ color: "#EF4444" }}>
                <AlertCircle className="w-3 h-3" />
                {errors.nik}
              </p>
            )}
          </div>

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#FBFAF9" }}>
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={displayValue(ktpData.nama, 'nama')}
              onChange={(e) => setKTPData({ ...ktpData, nama: e.target.value.toUpperCase() })}
              placeholder="NAMA LENGKAP"
              className="w-full px-4 py-3 rounded-lg border input-primary"
              style={{
                backgroundColor: "rgba(14, 16, 15, 0.5)",
                borderColor: errors.nama ? "#EF4444" : "rgba(251, 250, 249, 0.2)",
                color: "#FBFAF9"
              }}
            />
            {errors.nama && (
              <p className="text-sm mt-1 flex items-center gap-1" style={{ color: "#EF4444" }}>
                <AlertCircle className="w-3 h-3" />
                {errors.nama}
              </p>
            )}
          </div>

          {/* Tempat & Tanggal Lahir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#FBFAF9" }}>
                Tempat Lahir *
              </label>
              <input
                type="text"
                value={ktpData.tempatLahir}
                onChange={(e) => setKTPData({ ...ktpData, tempatLahir: e.target.value.toUpperCase() })}
                placeholder="JAKARTA"
                className="w-full px-4 py-3 rounded-lg border input-primary"
                style={{
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: errors.tempatLahir ? "#EF4444" : "rgba(251, 250, 249, 0.2)",
                  color: "#FBFAF9"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#FBFAF9" }}>
                Tanggal Lahir (DD-MM-YYYY) *
              </label>
              <input
                type="text"
                value={ktpData.tanggalLahir}
                onChange={(e) => setKTPData({ ...ktpData, tanggalLahir: e.target.value })}
                placeholder="25-01-1995"
                className="w-full px-4 py-3 rounded-lg border input-primary"
                style={{
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: errors.tanggalLahir ? "#EF4444" : "rgba(251, 250, 249, 0.2)",
                  color: "#FBFAF9"
                }}
              />
              {errors.tanggalLahir && (
                <p className="text-sm mt-1 flex items-center gap-1" style={{ color: "#EF4444" }}>
                  <AlertCircle className="w-3 h-3" />
                  {errors.tanggalLahir}
                </p>
              )}
            </div>
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#FBFAF9" }}>
              Jenis Kelamin *
            </label>
            <select
              value={ktpData.jenisKelamin}
              onChange={(e) => setKTPData({ ...ktpData, jenisKelamin: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border input-primary"
              style={{
                backgroundColor: "rgba(14, 16, 15, 0.5)",
                borderColor: errors.jenisKelamin ? "#EF4444" : "rgba(251, 250, 249, 0.2)",
                color: "#FBFAF9"
              }}
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="LAKI-LAKI">LAKI-LAKI</option>
              <option value="PEREMPUAN">PEREMPUAN</option>
            </select>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#FBFAF9" }}>
              Alamat
            </label>
            <textarea
              value={displayValue(ktpData.alamat, 'alamat')}
              onChange={(e) => setKTPData({ ...ktpData, alamat: e.target.value.toUpperCase() })}
              placeholder="ALAMAT LENGKAP"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border input-primary resize-none"
              style={{
                backgroundColor: "rgba(14, 16, 15, 0.5)",
                borderColor: "rgba(251, 250, 249, 0.2)",
                color: "#FBFAF9"
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
            style={{
              background: isLoading 
                ? "rgba(131, 110, 249, 0.3)" 
                : "linear-gradient(135deg, #836EF9 0%, #A0055D 100%)",
              color: "#FBFAF9"
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5"></div>
                <span>Generating ZK Proof...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Generate Age Proof</span>
              </div>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center text-sm" style={{ color: "rgba(251, 250, 249, 0.6)" }}>
          🔐 Zero-knowledge proof akan membuktikan umur {'>'}= 18 tanpa mengungkapkan data personal
        </div>
      </div>
    </div>
  )
}

export default KTPInputForm
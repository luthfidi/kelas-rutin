// Format KTP Indonesia
export interface KTPData {
  nik: string;           // 16 digit NIK
  nama: string;          // Nama lengkap
  tempatLahir: string;   // Tempat lahir
  tanggalLahir: string;  // DD-MM-YYYY
  jenisKelamin: string;  // L/P
  alamat: string;        // Alamat lengkap
  rt: string;            // RT
  rw: string;            // RW
  kelurahan: string;     // Kelurahan/Desa
  kecamatan: string;     // Kecamatan
  agama: string;         // Agama
  statusPerkawinan: string; // Status perkawinan
  pekerjaan: string;     // Pekerjaan
  kewarganegaraan: string; // WNI/WNA
  berlakuHingga: string; // Berlaku hingga
}

// Data untuk ZK proof (only what we need)
export interface KTPProofInput {
  birthDay: number;    // 1-31
  birthMonth: number;  // 1-12
  birthYear: number;   // e.g., 1995
  currentYear: number; // e.g., 2024
  salt: bigint;        // Random salt untuk privacy
}

// ZK proof output
export interface AgeProofOutput {
  proof: {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
  };
  publicSignals: string[];
}
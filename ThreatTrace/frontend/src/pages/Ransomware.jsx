// src/pages/Ransomware.jsx

export default function Ransomware() {
  return (
    <div>
      <h2 className="text-3xl cyber-gradient-text mb-4">Ransomware Scanner</h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="cyber-card">
          <h3 className="font-semibold mb-2">Upload & Scan</h3>
          <p className="text-sm text-gray-300">Upload a sample file to analyze entropy and suspicious properties.</p>
          {/* Upload component - you already have UploadScan.jsx; import and use it if desired */}
        </div>

        <div className="cyber-card">
          <h3 className="font-semibold mb-2">Recent Scan Results</h3>
          <p className="text-sm text-gray-300">Scan history and quick status.</p>
        </div>
      </div>
    </div>
  );
}

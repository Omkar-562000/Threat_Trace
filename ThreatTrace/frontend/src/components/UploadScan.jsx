import axios from "axios";
import { useState } from "react";

export default function UploadScan({ onScanComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please choose a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("Uploading and scanning...");
      const res = await axios.post("http://127.0.0.1:5000/api/ransomware/upload-scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000,
      });
      setMessage("Scan complete.");
      if (onScanComplete) onScanComplete(res.data.result);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      <h3 className="text-lg font-semibold mb-2">Upload & Scan File</h3>
      <input
        type="file"
        onChange={handleFileChange}
        className="mb-2 text-sm text-white"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-3 py-1 rounded bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Scanning..." : "Upload & Scan"}
        </button>
        <span className="text-sm text-gray-300">{message}</span>
      </div>
    </div>
  );
}

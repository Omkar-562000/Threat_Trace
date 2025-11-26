import axios from "axios";
import { useState } from "react";

export default function Ransomware() {
    const [file, setFile] = useState(null);
    const [scanLogs, setScanLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleScan = async () => {
        if (!file) return alert("Please select a file!");

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            const res = await axios.post("http://localhost:5000/api/scan", formData);

            const newLog = {
                path: file.name,
                entropy: res.data.entropy,
                status: res.data.status,
                reason: res.data.reason,
                timestamp: new Date().toLocaleString(),
            };

            setScanLogs([newLog, ...scanLogs]);
        } catch (error) {
            console.error(error);
            alert("Scan failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-8 py-6">

            {/* PAGE TITLE */}
            <h1 className="text-center text-4xl font-bold cyber-gradient-text mb-10">
                Ransomware Detection Module
            </h1>

            {/* === Upload Card === */}
            <div className="glass-cyber p-6 rounded-2xl shadow-xl border border-white/20 mb-10">
                <h2 className="text-xl font-bold text-cyan-300 mb-4">
                    🧪 Upload File for Ransomware Scan
                </h2>

                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="cyber-input"
                    />

                    <button
                        onClick={handleScan}
                        disabled={loading}
                        className="cyber-btn px-6 py-3 rounded-xl"
                    >
                        {loading ? "Scanning..." : "Upload & Scan"}
                    </button>
                </div>
            </div>

            {/* === SCAN LOG TABLE === */}
            <div className="glass-cyber p-6 rounded-2xl border border-white/20">
                <h2 className="text-xl font-bold text-purple-300 mb-4">
                    🛡 Ransomware Scan Logs
                </h2>

                <table className="w-full text-white">
                    <thead>
                        <tr className="text-left border-b border-white/20">
                            <th className="p-3">File Path</th>
                            <th className="p-3">Entropy</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scanLogs.length === 0 && (
                            <tr>
                                <td className="p-3 text-gray-400" colSpan="5">
                                    No scans performed yet.
                                </td>
                            </tr>
                        )}

                        {scanLogs.map((log, index) => (
                            <tr
                                key={index}
                                className="border-b border-white/10 hover:bg-white/10 transition"
                            >
                                <td className="p-3">{log.path}</td>
                                <td className="p-3">{log.entropy}</td>
                                <td
                                    className={`p-3 font-bold ${
                                        log.status === "Malicious"
                                            ? "text-red-500"
                                            : "text-green-400"
                                    }`}
                                >
                                    {log.status}
                                </td>
                                <td className="p-3">{log.reason}</td>
                                <td className="p-3">{log.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import axios from "axios";
import { useEffect, useState } from "react";

export default function Dashboard() {

    const [logs, setLogs] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [scanResult, setScanResult] = useState(null);

    // Audit states
    const [auditPath, setAuditPath] = useState("");
    const [auditResult, setAuditResult] = useState(null);

    // Fetch Logs Initially
    useEffect(() => {
        fetchRansomwareLogs();
    }, []);

    const fetchRansomwareLogs = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:5000/api/ransomware/logs");
            setLogs(res.data.logs);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    // FILE UPLOAD
    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const uploadAndScan = async () => {
        if (!selectedFile) {
            alert("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await axios.post(
                "http://127.0.0.1:5000/api/ransomware/upload-scan",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            setScanResult(res.data.result);
            fetchRansomwareLogs();
        } catch (error) {
            console.error("Upload scan error:", error);
        }
    };

    // AUDIT LOG CHECKING
    const verifyAuditLog = async () => {
        if (!auditPath) {
            alert("Enter a valid file path.");
            return;
        }

        try {
            const res = await axios.post(
                "http://127.0.0.1:5000/api/audit/verify",
                { log_path: auditPath }
            );

            setAuditResult(res.data);
        } catch (err) {
            console.error("Audit error:", err);
            alert("Error verifying log file.");
        }
    };


    return (
        <div className="min-h-screen bg-cyberDark text-white p-6 relative">

            {/* Background Glow Effects */}
            <div className="absolute w-96 h-96 bg-cyberPurple/20 blur-3xl rounded-full top-20 left-10"></div>
            <div className="absolute w-80 h-80 bg-cyberNeon/20 blur-3xl rounded-full bottom-10 right-10"></div>


            <h1 className="text-4xl font-Orbitron font-bold mb-10 text-center text-cyberPurple tracking-widest">
                ThreatTrace Dashboard
            </h1>

            {/* GRID: Three Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ====== UPLOAD + SCAN SECTION ====== */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl 
                                hover:border-cyberNeon/40 hover:shadow-cyberNeon/20 transition">
                    <h2 className="text-2xl font-semibold mb-4 text-cyberNeon">
                        🔍 Upload File for Ransomware Scan
                    </h2>

                    <input
                        type="file"
                        onChange={handleFileSelect}
                        className="bg-white/10 border border-white/20 p-3 rounded-lg w-full mb-4"
                    />

                    <button
                        onClick={uploadAndScan}
                        className="px-4 py-3 w-full rounded-lg bg-cyberPurple hover:bg-cyberNeon font-bold
                                   shadow-lg shadow-cyberPurple/40 transition"
                    >
                        Upload & Scan
                    </button>

                    {scanResult && (
                        <div className="mt-4 p-4 bg-white/10 border border-white/20 rounded-lg text-sm">
                            <h3 className="font-bold text-cyberNeon">Scan Result</h3>
                            <p><strong>File:</strong> {scanResult.path}</p>
                            <p><strong>Entropy:</strong> {scanResult.entropy}</p>
                            <p><strong>Suspicious:</strong> {scanResult.suspicious ? "YES" : "NO"}</p>

                            <p><strong>Reason:</strong> 
                                {scanResult.reason.length ? scanResult.reason.join(", ") : "None"}
                            </p>
                        </div>
                    )}
                </div>


                {/* ====== AUDIT LOG INTEGRITY SECTION ====== */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl 
                                hover:border-cyberPurple/40 hover:shadow-cyberPurple/20 transition">
                    <h2 className="text-2xl font-semibold mb-4 text-cyberNeon">
                        📝 Audit Log Integrity Checker
                    </h2>

                    <input
                        type="text"
                        placeholder="Enter log file path (E:/ThreatTrace/system.log)"
                        value={auditPath}
                        onChange={(e) => setAuditPath(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300 mb-4"
                    />

                    <button
                        onClick={verifyAuditLog}
                        className="px-4 py-3 w-full rounded-lg bg-cyberPurple hover:bg-cyberNeon font-bold
                                   shadow-lg shadow-cyberPurple/40 transition"
                    >
                        Verify Integrity
                    </button>

                    {auditResult && (
                        <div className="mt-4 p-4 bg-white/10 border border-white/20 rounded-lg text-sm">
                            <h3 className="font-bold mb-2 text-cyberNeon">Audit Result</h3>

                            <p><strong>Status:</strong> 
                                {auditResult.status === "clean" && <span className="text-green-400"> Clean</span>}
                                {auditResult.status === "tampered" && <span className="text-red-400"> ⚠ Tampered</span>}
                                {auditResult.status === "new" && <span className="text-blue-400"> First Time Registered</span>}
                            </p>

                            <p><strong>Message:</strong> {auditResult.message}</p>
                            <p><strong>Hash:</strong> {auditResult.hash}</p>
                        </div>
                    )}
                </div>
            </div>


            {/* ====== RANSOMWARE TABLE SECTION (FULL WIDTH) ====== */}
            <div className="mt-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-semibold mb-4 text-cyberNeon">
                    🛡️ Ransomware Scan Logs
                </h2>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/10 border border-white/20">
                            <th className="p-3">File Path</th>
                            <th className="p-3">Entropy</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Timestamp</th>
                        </tr>
                    </thead>

                    <tbody>
                        {logs.map((log, idx) => (
                            <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition">
                                <td className="p-3">{log.path}</td>
                                <td className="p-3">{log.entropy?.toFixed(2)}</td>
                                <td className="p-3">
                                    {log.suspicious ? (
                                        <span className="text-red-400 font-bold">Suspicious</span>
                                    ) : (
                                        <span className="text-green-400 font-bold">Clean</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {log.reason?.length > 0 ? log.reason.join(", ") : "None"}
                                </td>
                                <td className="p-3">
                                    {new Date(log.scan_time).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {logs.length === 0 && (
                    <p className="text-gray-400 mt-4">No scans recorded yet.</p>
                )}
            </div>
        </div>
    );
}

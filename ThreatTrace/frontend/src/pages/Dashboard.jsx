import LogIntegrityAudit from "../components/LogIntegrityAudit";
import RansomwareMonitor from "../components/RansomwareMonitor";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-2">ThreatTrace Pro Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Welcome to the centralized monitoring hub — view live ransomware alerts, audit integrity checks, and system status here.
      </p>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🦠 Ransomware Panel */}
        <RansomwareMonitor />

        {/* 🧾 Log Integrity Audit Panel */}
        <LogIntegrityAudit />
      </div>
    </div>
  );
}

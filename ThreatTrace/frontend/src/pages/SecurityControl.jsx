import { useEffect, useState } from "react";
import { hasRole } from "../utils/role";
import Toast from "../components/ui/Toast";
import {
  getBlockedIps,
  getQuarantinedUsers,
  getSecurityAuditTrail,
  releaseQuarantinedUser,
  unblockIp,
} from "../services/securityService";
import {
  buildCanaryTrapUrl,
  createCanaryAsset,
  getCanaryAssets,
  getCanaryTriggers,
} from "../services/canaryService";

export default function SecurityControl() {
  const canManage = hasRole(["technical"]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [blockedIps, setBlockedIps] = useState([]);
  const [quarantinedUsers, setQuarantinedUsers] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [canaryAssets, setCanaryAssets] = useState([]);
  const [canaryTriggers, setCanaryTriggers] = useState([]);

  const pushToast = (msg, severity = "info") => {
    setToast({ msg, severity });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [ips, users, trail] = await Promise.all([
        getBlockedIps(true),
        getQuarantinedUsers(),
        getSecurityAuditTrail({ page: 1, per_page: 30 }),
      ]);
      const [assetsRes, triggersRes] = await Promise.all([
        getCanaryAssets(),
        getCanaryTriggers(),
      ]);
      setBlockedIps(ips.blocked_ips || []);
      setQuarantinedUsers(users.users || []);
      setAuditEvents(trail.events || []);
      setCanaryAssets(assetsRes.assets || []);
      setCanaryTriggers(triggersRes.triggers || []);
    } catch (error) {
      console.error("SecurityControl load error:", error);
      pushToast(error?.response?.data?.message || "Failed to load security control data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUnblock = async (ip) => {
    if (!canManage) return;
    try {
      await unblockIp(ip);
      pushToast(`Unblocked ${ip}`, "success");
      loadAll();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to unblock IP", "error");
    }
  };

  const handleReleaseUser = async (userId) => {
    if (!canManage) return;
    try {
      await releaseQuarantinedUser(userId);
      pushToast("User quarantine released", "success");
      loadAll();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to release user", "error");
    }
  };

  const handleCreateCanary = async () => {
    try {
      const now = new Date();
      await createCanaryAsset({
        name: `Canary Report Link ${now.toISOString().slice(0, 19)}`,
        asset_type: "link",
        metadata: { suggested_embed: "reports/log exports, email decoys, fake docs" },
      });
      pushToast("Canary trap created", "success");
      loadAll();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to create canary trap", "error");
    }
  };

  if (!canManage) {
    return (
      <div className="cyber-card">
        <h2 className="text-2xl font-semibold mb-2 text-white">Security Control</h2>
        <p className="text-gray-400">
          Technical role required to access runtime containment controls.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cyber-card text-center py-10">
        <p className="text-gray-300">Loading security control data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.msg}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h2 className="text-3xl cyber-gradient-text mb-2">Security Control</h2>
        <p className="text-gray-400">
          Runtime containment center: blocked sources, quarantined users, and security audit chain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card text-center">
          <p className="text-gray-400 text-sm">Blocked IPs</p>
          <p className="text-3xl font-bold text-red-400">{blockedIps.length}</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-gray-400 text-sm">Quarantined Users</p>
          <p className="text-3xl font-bold text-yellow-400">{quarantinedUsers.length}</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-gray-400 text-sm">Recent Audit Events</p>
          <p className="text-3xl font-bold text-cyberNeon">{auditEvents.length}</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-gray-400 text-sm">Canary Assets</p>
          <p className="text-3xl font-bold text-orange-400">{canaryAssets.length}</p>
        </div>
        <div className="cyber-card text-center">
          <p className="text-gray-400 text-sm">Canary Triggers</p>
          <p className="text-3xl font-bold text-red-500">{canaryTriggers.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Blocked IPs</h3>
            <button className="cyber-btn" onClick={loadAll}>Refresh</button>
          </div>
          <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
            {blockedIps.length === 0 && <p className="text-sm text-gray-400">No active blocked IPs.</p>}
            {blockedIps.map((row) => (
              <div key={row.ip} className="border border-white/10 rounded-lg p-3 bg-white/5">
                <p className="font-semibold text-white">{row.ip}</p>
                <p className="text-xs text-gray-400 mt-1">Reason: {row.reason || "N/A"}</p>
                <p className="text-xs text-gray-500">Blocked Until: {row.blocked_until ? new Date(row.blocked_until).toLocaleString() : "N/A"}</p>
                <button
                  className="mt-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs"
                  onClick={() => handleUnblock(row.ip)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cyber-card">
          <h3 className="text-lg font-semibold mb-3">Quarantined Users</h3>
          <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
            {quarantinedUsers.length === 0 && <p className="text-sm text-gray-400">No quarantined users.</p>}
            {quarantinedUsers.map((u) => (
              <div key={u.user_id} className="border border-white/10 rounded-lg p-3 bg-white/5">
                <p className="font-semibold text-white">{u.name || "Unknown User"} ({u.role || "unknown"})</p>
                <p className="text-xs text-gray-400">{u.email || "-"}</p>
                <p className="text-xs text-gray-500 mt-1">Until: {u.locked_until ? new Date(u.locked_until).toLocaleString() : "N/A"}</p>
                <p className="text-xs text-gray-500">Reason: {u.security_quarantine_reason || "N/A"}</p>
                <button
                  className="mt-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs"
                  onClick={() => handleReleaseUser(u.user_id)}
                >
                  Release
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cyber-card">
        <h3 className="text-lg font-semibold mb-3">Security Audit Trail (Recent)</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">IP</th>
                <th className="py-2 pr-3">User</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((e) => (
                <tr key={e.event_id} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-gray-300">{e.timestamp ? new Date(e.timestamp).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-3 text-white">{e.action}</td>
                  <td className="py-2 pr-3 text-gray-300">{e.status}</td>
                  <td className="py-2 pr-3 text-gray-300">{e.ip || "-"}</td>
                  <td className="py-2 pr-3 text-gray-300">{e.user_id || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Canary Assets</h3>
            <button className="cyber-btn bg-orange-600 hover:bg-orange-700" onClick={handleCreateCanary}>
              Create Canary
            </button>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
            {canaryAssets.length === 0 && <p className="text-sm text-gray-400">No canary assets yet.</p>}
            {canaryAssets.map((asset) => (
              <div key={asset.token} className="border border-white/10 rounded-lg p-3 bg-white/5">
                <p className="font-semibold text-white">{asset.name}</p>
                <p className="text-xs text-gray-400 mt-1">Token: {asset.token}</p>
                <p className="text-xs text-gray-500 break-all">
                  Trap URL: {buildCanaryTrapUrl(asset.token)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="cyber-card">
          <h3 className="text-lg font-semibold mb-3">Canary Trigger Events</h3>
          <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
            {canaryTriggers.length === 0 && <p className="text-sm text-gray-400">No canary triggers yet.</p>}
            {canaryTriggers.map((t, idx) => (
              <div key={`${t.token}-${t.triggered_at}-${idx}`} className="border border-red-500/30 rounded-lg p-3 bg-red-900/10">
                <p className="font-semibold text-red-300">{t.asset_name || "Canary Asset"} triggered</p>
                <p className="text-xs text-gray-300">IP: {t.ip} | {t.city}, {t.country}</p>
                <p className="text-xs text-gray-400">Token: {t.token}</p>
                <p className="text-xs text-gray-500">{t.triggered_at ? new Date(t.triggered_at).toLocaleString() : "-"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

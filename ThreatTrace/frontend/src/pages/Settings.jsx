// src/pages/Settings.jsx
import { getUserRole, getRoleDisplayName, getRoleBadgeColor } from "../utils/role";

export default function Settings() {
  const role = getUserRole();
  const roleName = getRoleDisplayName();
  const badgeColor = getRoleBadgeColor();

  return (
    <div>
      <h2 className="text-3xl cyber-gradient-text mb-4">Settings</h2>

      {/* Account Information */}
      <div className="cyber-card mb-6">
        <h3 className="text-xl font-semibold mb-4 text-cyberBlue">Account Information</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg border border-cyberPurple/20">
            <div>
              <p className="text-sm text-gray-400">Account Type</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badgeColor}`}>
                  {roleName}
                </span>
              </div>
            </div>
          </div>

          {/* Role-based Features Info */}
          <div className="p-4 bg-dark-800/50 rounded-lg border border-cyberPurple/20">
            <p className="text-sm text-gray-400 mb-3">Your Plan Features:</p>
            <ul className="space-y-2 text-sm">
              {role === "personal" && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Basic threat monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">File integrity checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Real-time alerts</span>
                  </li>
                </>
              )}
              {role === "corporate" && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">All Personal features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Advanced analytics & reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Export audit logs (CSV/PDF)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Scheduled automated scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Priority email support</span>
                  </li>
                </>
              )}
              {role === "technical" && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">All Corporate features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">API access for automation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Custom integration support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Advanced threat intelligence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Custom detection rules</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Application Settings */}
      <div className="cyber-card">
        <h3 className="text-xl font-semibold mb-2 text-cyberBlue">Application Settings</h3>
        <p className="text-sm text-gray-300">Configure API keys, email, and system preferences.</p>
      </div>
    </div>
  );
}

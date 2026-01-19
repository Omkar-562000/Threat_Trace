// src/pages/EnhancedDashboard.jsx - Enhanced Dashboard with 3D Globe & Analytics
import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheckIcon, FireIcon, GlobeAltIcon, ChartBarIcon, ExclamationTriangleIcon, ClockIcon } from "@heroicons/react/24/outline";
import GlobeVisualization from "../components/GlobeVisualization";
import ThreatTrendsChart from "../components/ThreatTrendsChart";
import ThreatTypesChart from "../components/ThreatTypesChart";
import SeverityChart from "../components/SeverityChart";
import StatCard from "../components/StatCard";
import Toast from "../components/ui/Toast";
import socket from "../utils/socket";

export default function EnhancedDashboard() {
  const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
  const API = `${API_ROOT}/api/dashboard`;

  // States
  const [threatLocations, setThreatLocations] = useState([]);
  const [threatTrends, setThreatTrends] = useState([]);
  const [threatTypes, setThreatTypes] = useState([]);
  const [severityStats, setSeverityStats] = useState({});
  const [dashboardStats, setDashboardStats] = useState({});
  const [topThreats, setTopThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // ============================================================
  // FETCH ALL DASHBOARD DATA
  // ============================================================
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [locations, trends, types, severity, stats, threats] = await Promise.all([
        axios.get(`${API}/threat-locations`),
        axios.get(`${API}/threat-trends`),
        axios.get(`${API}/threat-types`),
        axios.get(`${API}/severity-stats`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/top-threats`)
      ]);

      setThreatLocations(locations.data.threats || []);
      setThreatTrends(trends.data.data || []);
      setThreatTypes(types.data.data || []);
      setSeverityStats(severity.data.data || {});
      setDashboardStats(stats.data.stats || {});
      setTopThreats(threats.data.threats || []);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setToast({
        message: "Failed to load dashboard data",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REAL-TIME UPDATES
  // ============================================================
  useEffect(() => {
    // Initial fetch
    fetchAllData();

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 30000);

    // Real-time alerts
    const onAlert = (msg) => {
      setToast({
        message: msg?.message || "New Security Alert!",
        severity: msg?.severity || "warn",
      });
      setTimeout(() => setToast(null), 3500);
      
      // Refresh data on new alert
      fetchAllData();
    };

    socket.on("new_alert", onAlert);
    socket.on("tamper_alert", onAlert);
    socket.on("ransomware_alert", onAlert);

    return () => {
      clearInterval(refreshInterval);
      socket.off("new_alert", onAlert);
      socket.off("tamper_alert", onAlert);
      socket.off("ransomware_alert", onAlert);
    };
  }, []);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-cyberDark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Threat Intelligence...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // SEVERITY BADGE HELPER
  // ============================================================
  const getSeverityBadge = (severity) => {
    const styles = {
      critical: "bg-red-500/20 text-red-400 border-red-500/50",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      low: "bg-blue-500/20 text-blue-400 border-blue-500/50"
    };
    return styles[severity?.toLowerCase()] || styles.medium;
  };

  // ============================================================
  // UI RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-cyberDark text-white p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      {/* Animated Background */}
      <div className="absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[600px] md:h-[600px] bg-purple-600/10 blur-[80px] md:blur-[120px] rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[500px] md:h-[500px] bg-cyan-600/10 blur-[80px] md:blur-[120px] rounded-full bottom-0 right-0 translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="mb-6 sm:mb-8 relative z-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          ThreatTrace Command Center
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm">Real-time Global Threat Intelligence Dashboard</p>
      </div>

      {/* Quick Stats Cards - Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10">
        <StatCard
          title="Total Threats Today"
          value={dashboardStats.total_threats_today?.toLocaleString() || "0"}
          subtitle="Across all severity levels"
          icon={<FireIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="red"
          trend={{ type: "up", value: "+12.5% from yesterday" }}
        />
        <StatCard
          title="Blocked Attacks"
          value={dashboardStats.blocked_attacks?.toLocaleString() || "0"}
          subtitle="Successfully mitigated"
          icon={<ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="green"
          trend={{ type: "up", value: "+8.3% effectiveness" }}
        />
        <StatCard
          title="Active Threats"
          value={dashboardStats.active_threats || "0"}
          subtitle="Requires immediate attention"
          icon={<ExclamationTriangleIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="yellow"
          trend={{ type: "down", value: "-3 from last hour" }}
        />
        <StatCard
          title="Global Coverage"
          value={dashboardStats.countries_affected || "0"}
          subtitle="Countries affected"
          icon={<GlobeAltIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="cyan"
        />
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 md:gap-6 relative z-10">
        
        {/* 3D GLOBE - Large Panel (Spans 8 columns) */}
        <div className="col-span-12 lg:col-span-8 glass-cyber p-4 sm:p-5 md:p-6 border border-white/20 rounded-xl md:rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-cyan-400 flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              Global Threat Map
            </h2>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Live</span>
            </div>
          </div>
          <div className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden">
            <GlobeVisualization threats={threatLocations} />
          </div>
        </div>

        {/* TOP THREATS LIST - Side Panel (Spans 4 columns) */}
        <div className="col-span-12 lg:col-span-4 glass-cyber p-4 sm:p-5 md:p-6 border border-white/20 rounded-xl md:rounded-2xl shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-red-400 mb-3 sm:mb-4 flex items-center gap-2">
            <FireIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            Active Threats
          </h2>
          <div className="space-y-3 max-h-[300px] sm:max-h-[400px] lg:max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
            {topThreats.map((threat, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm mb-1">
                      {threat.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {threat.id}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border ${getSeverityBadge(threat.severity)} font-semibold uppercase`}>
                    {threat.severity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Via: <span className="text-cyan-400">{threat.source}</span>
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {threat.timestamp}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {threat.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THREAT TRENDS CHART - Wide Panel */}
        <div className="col-span-12 lg:col-span-8 glass-cyber p-4 sm:p-5 md:p-6 border border-white/20 rounded-xl md:rounded-2xl shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-purple-400 mb-3 sm:mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            24-Hour Threat Trends
          </h2>
          <div className="h-[250px] sm:h-[300px] md:h-[350px]">
            <ThreatTrendsChart data={threatTrends} />
          </div>
        </div>

        {/* SEVERITY DISTRIBUTION - Small Panel */}
        <div className="col-span-12 lg:col-span-4 glass-cyber p-4 sm:p-5 md:p-6 border border-white/20 rounded-xl md:rounded-2xl shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-3 sm:mb-4">
            Severity Breakdown
          </h2>
          <div className="h-[250px] sm:h-[300px] md:h-[350px]">
            <SeverityChart data={severityStats} />
          </div>
        </div>

        {/* THREAT TYPES CHART - Medium Panel */}
        <div className="col-span-12 lg:col-span-6 glass-cyber p-4 sm:p-5 md:p-6 border border-white/20 rounded-xl md:rounded-2xl shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-pink-400 mb-3 sm:mb-4">
            Attack Types Distribution
          </h2>
          <div className="h-[300px] sm:h-[350px] md:h-[400px]">
            <ThreatTypesChart data={threatTypes} />
          </div>
        </div>

        {/* SYSTEM STATS - Info Panel */}
        <div className="col-span-12 lg:col-span-6 glass-cyber p-4 sm:p-5 md:p-6 border border-white/20 rounded-xl md:rounded-2xl shadow-2xl">
          <h2 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-3 sm:mb-4">
            System Performance
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Files Scanned</div>
                <div className="text-xl sm:text-2xl font-bold text-white">{dashboardStats.files_scanned?.toLocaleString() || "0"}</div>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <div className="text-xs sm:text-sm text-gray-400 mb-1">Integrity Checks</div>
                <div className="text-xl sm:text-2xl font-bold text-white">{dashboardStats.integrity_checks?.toLocaleString() || "0"}</div>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-xs sm:text-sm text-gray-400 mb-2">Avg Response</div>
                <div className="text-lg sm:text-xl font-bold text-green-400">{dashboardStats.avg_response_time || "N/A"}</div>
              </div>
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-xs sm:text-sm text-gray-400 mb-2">Uptime</div>
                <div className="text-lg sm:text-xl font-bold text-green-400">{dashboardStats.uptime || "N/A"}</div>
              </div>
            </div>

            {/* Real-time status indicator */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl border border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-green-400">All Systems Operational</div>
                  <div className="text-xs text-gray-400">Last updated: Just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 sm:mt-8 text-center text-xs text-gray-500 relative z-10 px-2">
        <p>ThreatTrace © 2026 - AI-Powered Security Monitoring Platform</p>
        <p className="mt-1 hidden sm:block">Data refreshes every 30 seconds | Real-time threat detection active</p>
      </div>
    </div>
  );
}

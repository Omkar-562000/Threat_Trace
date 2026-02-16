// src/pages/EnhancedDashboard.jsx - Real-Time Enhanced Dashboard
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheckIcon, 
  FireIcon, 
  GlobeAltIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import GlobeVisualization from "../components/GlobeVisualization";
import ThreatTrendsChart from "../components/ThreatTrendsChart";
import ThreatTypesChart from "../components/ThreatTypesChart";
import SeverityChart from "../components/SeverityChart";
import AnimatedStatCard from "../components/AnimatedStatCard";
import LiveActivityFeed from "../components/LiveActivityFeed";
import Toast from "../components/ui/Toast";
import socket from "../utils/socket";
import axiosInstance from "../utils/axiosConfig";

export default function EnhancedDashboard() {
  const navigate = useNavigate();
  const API_ROOT = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";
  const API = `${API_ROOT}/api/dashboard`;

  // States
  const [threatLocations, setThreatLocations] = useState([]);
  const [threatTrends, setThreatTrends] = useState([]);
  const [threatTypes, setThreatTypes] = useState([]);
  const [severityStats, setSeverityStats] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    total_threats_today: 0,
    blocked_attacks: 0,
    active_threats: 0,
    files_scanned: 0,
    integrity_checks: 0,
    countries_affected: 0,
  });
  const [topThreats, setTopThreats] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ============================================================
  // FETCH ALL DASHBOARD DATA
  // ============================================================
  const fetchAllData = async () => {
    try {
      setLoading(true);

      let locationsData = [];
      try {
        const tracked = await axiosInstance.get(`${API_ROOT}/api/locations/recent`, {
          params: { hours: 24 },
        });
        locationsData = tracked.data?.points || [];
      } catch {
        const fallback = await axios.get(`${API}/threat-locations`);
        locationsData = fallback.data?.threats || [];
      }

      const [trends, types, severity, stats, threats] = await Promise.all([
        axios.get(`${API}/threat-trends`),
        axios.get(`${API}/threat-types`),
        axios.get(`${API}/severity-stats`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/top-threats`)
      ]);

      setThreatLocations(locationsData);
      setThreatTrends(trends.data.data || []);
      setThreatTypes(types.data.data || []);
      setSeverityStats(severity.data.data || {});
      setDashboardStats(stats.data.stats || {});
      setTopThreats(threats.data.threats || []);
      setLastUpdated(new Date());
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
  // REAL-TIME WEBSOCKET UPDATES
  // ============================================================
  useEffect(() => {
    // Initial fetch
    fetchAllData();

    // Auto-refresh every 30 seconds (fallback)
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 30000);

    // ========== WebSocket Event Listeners ==========

    // 1. Real-time stats update
    const handleStatsUpdate = (data) => {
      console.log("[WebSocket] Stats update:", data);
      setDashboardStats(prev => ({
        ...prev,
        ...data
      }));
    };

    // 2. New threat location
    const handleThreatLocation = (data) => {
      console.log("[WebSocket] New threat location:", data);
      setThreatLocations(prev => {
        // Add new location or update existing
        const existing = prev.find(l => l.lat === data.lat && l.lng === data.lng);
        if (existing) {
          return prev.map(l => 
            l.lat === data.lat && l.lng === data.lng 
              ? { ...l, count: l.count + 1 }
              : l
          );
        }
        return [...prev, { ...data, count: 1 }];
      });
    };

    // 3. Activity feed update
    const handleActivityUpdate = (data) => {
      console.log("[WebSocket] Activity update:", data);
      setActivityFeed(prev => [data, ...prev].slice(0, 50));
    };

    // 4. Scan progress
    const handleScanProgress = (data) => {
      console.log("[WebSocket] Scan progress:", data);
      // Update activity feed with scan progress
      setActivityFeed(prev => [{
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'scan',
        severity: 'info',
        message: `Scanning: ${data.file || 'Unknown file'}`,
        details: `${data.current} / ${data.total}`,
        source: data.type || 'Auto Scanner'
      }, ...prev].slice(0, 50));
    };

    // 5. General alerts (existing)
    const handleAlert = (msg) => {
      console.log("[WebSocket] Alert:", msg);
      
      setToast({
        message: msg?.message || "New Security Alert!",
        severity: msg?.severity || "warn",
      });
      
      // Add to activity feed
      setActivityFeed(prev => [{
        id: `alert-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: msg?.source || 'alert',
        severity: msg?.severity || 'medium',
        message: msg?.message || 'Security Alert',
        details: msg?.details || null,
        source: msg?.source || 'System'
      }, ...prev].slice(0, 50));
      
      // Refresh data
      setTimeout(() => fetchAllData(), 1000);
    };

    // 6. System log events
    const handleSystemLog = (log) => {
      console.log("[WebSocket] System log:", log);
      
      // Add important logs to activity feed
      if (log.level === 'ERROR' || log.level === 'CRITICAL' || log.level === 'WARNING') {
        setActivityFeed(prev => [{
          id: `log-${Date.now()}`,
          timestamp: log.timestamp || new Date().toISOString(),
          type: 'event',
          severity: log.level?.toLowerCase() || 'info',
          message: log.message || 'System Event',
          source: log.source || 'System',
          details: log.message?.length > 50 ? log.message : null
        }, ...prev].slice(0, 50));
      }
    };

    // 7. Chart data update
    const handleChartUpdate = (data) => {
      console.log("[WebSocket] Chart update:", data);
      if (data.chart === 'threat_timeline') {
        setThreatTrends(prev => [...prev, data.data].slice(-24));
      }
    };

    // Register all WebSocket listeners
    socket.on("stats_update", handleStatsUpdate);
    socket.on("threat_location", handleThreatLocation);
    socket.on("activity_update", handleActivityUpdate);
    socket.on("scan_progress", handleScanProgress);
    socket.on("new_alert", handleAlert);
    socket.on("tamper_alert", handleAlert);
    socket.on("ransomware_alert", handleAlert);
    socket.on("system_log", handleSystemLog);
    socket.on("chart_update", handleChartUpdate);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      socket.off("stats_update", handleStatsUpdate);
      socket.off("threat_location", handleThreatLocation);
      socket.off("activity_update", handleActivityUpdate);
      socket.off("scan_progress", handleScanProgress);
      socket.off("new_alert", handleAlert);
      socket.off("tamper_alert", handleAlert);
      socket.off("ransomware_alert", handleAlert);
      socket.off("system_log", handleSystemLog);
      socket.off("chart_update", handleChartUpdate);
    };
  }, []);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-gray-900/60 via-purple-900/40 to-violet-900/40 rounded-2xl border border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading Dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Initializing real-time threat monitoring</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER DASHBOARD
  // ============================================================
  return (
    <div className="bg-gradient-to-br from-gray-900/40 via-purple-900/20 to-violet-900/20 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/10">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
          ThreatTrace Dashboard
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm md:text-base">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Real-time threat monitoring and analytics
          </p>
          <span className="hidden sm:inline text-gray-600">|</span>
          <p className="text-xs md:text-sm">
            Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : "just now"}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button className="cyber-btn" onClick={() => navigate("/alerts")}>Review Alerts</button>
        <button className="cyber-btn bg-cyberNeon/20 hover:bg-cyberNeon/30" onClick={() => navigate("/reports")}>Generate Report</button>
        <button className="cyber-btn bg-white/10 hover:bg-white/20 border border-white/20" onClick={() => navigate("/locations")}>Open Threat Map</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <AnimatedStatCard
          title="Total Threats Today"
          value={dashboardStats.total_threats_today}
          subtitle="Detected threats"
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          trend={{ type: 'up', value: '+12% from yesterday' }}
          color="red"
          animate={true}
        />
        <AnimatedStatCard
          title="Blocked Attacks"
          value={dashboardStats.blocked_attacks}
          subtitle="Successfully blocked"
          icon={<ShieldCheckIcon className="w-6 h-6" />}
          trend={{ type: 'up', value: '+8% effectiveness' }}
          color="green"
          animate={true}
        />
        <AnimatedStatCard
          title="Active Threats"
          value={dashboardStats.active_threats}
          subtitle="Requiring attention"
          icon={<FireIcon className="w-6 h-6" />}
          trend={{ type: 'down', value: '-3 from last hour' }}
          color="yellow"
          animate={true}
        />
        <AnimatedStatCard
          title="Files Scanned"
          value={dashboardStats.files_scanned}
          subtitle="Automated scans"
          icon={<DocumentMagnifyingGlassIcon className="w-6 h-6" />}
          trend={{ type: 'up', value: '+156 today' }}
          color="cyan"
          animate={true}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Globe Visualization - 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-gray-900/40 to-black/40 border border-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 h-[500px] md:h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <GlobeAltIcon className="w-6 h-6 text-purple-400" />
                Global Threat Map
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                {threatLocations.length} locations
              </span>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <GlobeVisualization
                threats={threatLocations}
                onThreatClick={(point) => {
                  const eventId = point.event_id || point.id;
                  if (eventId) {
                    navigate(`/locations?event_id=${eventId}`);
                  } else {
                    navigate("/locations");
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Activity Feed - 1 column */}
        <div className="h-[500px] md:h-[600px]">
          <LiveActivityFeed activities={activityFeed} maxItems={50} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Threat Trends */}
        <div className="bg-gradient-to-br from-gray-900/40 to-black/40 border border-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-cyan-400" />
            Threat Trends (24h)
          </h2>
          <div className="h-[300px]">
            <ThreatTrendsChart data={threatTrends} />
          </div>
        </div>

        {/* Threat Types Distribution */}
        <div className="bg-gradient-to-br from-gray-900/40 to-black/40 border border-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FireIcon className="w-6 h-6 text-red-400" />
            Threat Distribution
          </h2>
          <div className="h-[300px]">
            <ThreatTypesChart data={threatTypes} />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <AnimatedStatCard
          title="Integrity Checks"
          value={dashboardStats.integrity_checks}
          subtitle="Files monitored"
          icon={<LockClosedIcon className="w-6 h-6" />}
          color="purple"
          animate={true}
        />
        <AnimatedStatCard
          title="Countries Affected"
          value={dashboardStats.countries_affected}
          subtitle="Geographic spread"
          icon={<GlobeAltIcon className="w-6 h-6" />}
          color="blue"
          animate={true}
        />
        <AnimatedStatCard
          title="Avg Response Time"
          value={dashboardStats.avg_response_time}
          subtitle="Detection speed"
          icon={<ClockIcon className="w-6 h-6" />}
          color="green"
          animate={false}
        />
        <AnimatedStatCard
          title="System Uptime"
          value={dashboardStats.uptime}
          subtitle="Availability"
          icon={<ShieldCheckIcon className="w-6 h-6" />}
          color="cyan"
          animate={false}
        />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
                <p>ThreatTrace - Real-time automated security monitoring</p>
        <p className="text-xs mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

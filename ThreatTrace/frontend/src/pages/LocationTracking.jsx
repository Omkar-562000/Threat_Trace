import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import GlobeVisualization from "../components/GlobeVisualization";
import Toast from "../components/ui/Toast";
import socket from "../utils/socket";
import {
  getLocationEventById,
  getLocationEvents,
  getRecentLocationPoints,
  ingestLocationEvent,
} from "../services/locationService";

export default function LocationTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkedEventId = searchParams.get("event_id") || "";

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [points, setPoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedThreatId, setSelectedThreatId] = useState(deepLinkedEventId);
  const [severity, setSeverity] = useState("");
  const [source, setSource] = useState("");
  const [simulating, setSimulating] = useState(false);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (severity && e.severity !== severity) return false;
      if (source && !String(e.source || "").toLowerCase().includes(source.toLowerCase())) return false;
      return true;
    });
  }, [events, severity, source]);

  const showToast = (message, severityLevel = "info") => {
    setToast({ message, severity: severityLevel });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [pointsRes, eventsRes] = await Promise.all([
        getRecentLocationPoints(72),
        getLocationEvents({ page: 1, per_page: 50 }),
      ]);
      setPoints(pointsRes.points || []);
      setEvents(eventsRes.events || []);
    } catch (error) {
      console.error("Location tracking load error:", error);
      showToast("Failed to load location intelligence data", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectEventById = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await getLocationEventById(eventId);
      if (res.status === "success") {
        setSelectedEvent(res.event);
        setSelectedThreatId(eventId);
        setSearchParams({ event_id: eventId });
      }
    } catch (error) {
      console.error("selectEventById error:", error);
      showToast("Could not load selected event details", "warning");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (deepLinkedEventId) {
      selectEventById(deepLinkedEventId);
    }
  }, [deepLinkedEventId]);

  useEffect(() => {
    const onLocationEvent = () => loadData();
    const onThreatLocation = (point) => {
      setPoints((prev) => [point, ...prev].slice(0, 500));
    };

    socket.on("location_event", onLocationEvent);
    socket.on("threat_location", onThreatLocation);
    return () => {
      socket.off("location_event", onLocationEvent);
      socket.off("threat_location", onThreatLocation);
    };
  }, []);

  const onGlobePointClick = (point) => {
    const eventId = point.event_id || point.id;
    if (eventId) {
      selectEventById(eventId);
    }
  };

  const simulateAttackSource = async (count = 12) => {
    const demoIps = [
      "8.8.8.8",
      "1.1.1.1",
      "45.33.21.89",
      "185.220.101.35",
      "104.244.42.1",
      "31.13.71.36",
      "151.101.1.69",
      "13.107.21.200",
      "23.212.251.132",
      "52.95.110.1",
      "77.88.8.8",
      "208.67.222.222",
    ];
    const demoSeverities = ["critical", "high", "medium", "high", "critical"];
    const demoSources = ["ransomware", "audit", "system", "auth", "network"];
    const demoTypes = [
      "simulated_attack_source",
      "credential_stuffing",
      "botnet_probe",
      "tamper_attempt",
      "suspicious_login_pattern",
    ];
    const demoMessages = [
      "Repeated failed login attempts from source IP",
      "Anomalous request pattern detected against API endpoints",
      "Suspicious tamper behavior detected in audit stream",
      "Bot-like traffic burst observed in short interval",
      "Potential credential stuffing activity",
    ];

    try {
      setSimulating(true);

      let lastEventId = "";
      for (let i = 0; i < count; i += 1) {
        const selectedIp = demoIps[Math.floor(Math.random() * demoIps.length)];
        const selectedSeverity =
          demoSeverities[Math.floor(Math.random() * demoSeverities.length)];
        const selectedSource =
          demoSources[Math.floor(Math.random() * demoSources.length)];
        const selectedType =
          demoTypes[Math.floor(Math.random() * demoTypes.length)];
        const selectedMessage =
          demoMessages[Math.floor(Math.random() * demoMessages.length)];

        const res = await ingestLocationEvent({
          source_ip: selectedIp,
          event_type: selectedType,
          severity: selectedSeverity,
          source: selectedSource,
          title: "Simulated Threat Source",
          message: `${selectedMessage}: ${selectedIp}`,
          fail_count: Math.floor(Math.random() * 15) + 1,
          meta: { simulated: true, purpose: "demo", batch_index: i + 1 },
        });

        if (res?.status === "success" && res?.event?.event_id) {
          lastEventId = res.event.event_id;
        }
      }

      if (lastEventId) {
        showToast(`Injected ${count} simulated attack sources`, "success");
        await selectEventById(lastEventId);
      } else {
        showToast("Simulation completed with partial failures", "warning");
      }

      await loadData();
    } catch (error) {
      console.error("simulateAttackSource error:", error);
      showToast("Could not simulate attacker source", "error");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="cyber-card text-center py-12">
        <p className="text-gray-300">Loading location intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h2 className="text-3xl cyber-gradient-text mb-2">Location Intelligence</h2>
        <p className="text-gray-400">
          Track suspicious source locations and correlate incidents on the 3D globe.
        </p>
      </div>

      <div className="cyber-card bg-gradient-to-br from-red-900/20 to-orange-700/10 border-red-500/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">SOC Drill Simulator</h3>
            <p className="text-sm text-gray-300">
              Inject a demo attack-source event to validate geolocation, globe linking, and response flow.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="cyber-btn bg-red-600 hover:bg-red-700"
              onClick={() => simulateAttackSource(12)}
              disabled={simulating}
            >
              {simulating ? "Simulating..." : "Simulate x12"}
            </button>
            <button
              className="cyber-btn bg-orange-600 hover:bg-orange-700"
              onClick={() => simulateAttackSource(30)}
              disabled={simulating}
            >
              {simulating ? "Simulating..." : "Simulate x30"}
            </button>
          </div>
        </div>
      </div>

      <div className="cyber-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            className="cyber-input"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <input
            className="cyber-input"
            placeholder="Filter by source..."
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />

          <button className="cyber-btn" onClick={loadData}>
            Refresh Intelligence
          </button>
        </div>

        <div className="h-[520px] rounded-xl overflow-hidden border border-white/10">
          <GlobeVisualization
            threats={points}
            onThreatClick={onGlobePointClick}
            selectedThreatId={selectedThreatId}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cyber-card">
          <h3 className="text-lg font-semibold mb-3">Tracked Events</h3>
          <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
            {filteredEvents.length === 0 && (
              <p className="text-gray-400 text-sm">No location events found.</p>
            )}
            {filteredEvents.map((event) => (
              <button
                key={event.event_id}
                onClick={() => selectEventById(event.event_id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedThreatId === event.event_id
                    ? "border-cyberNeon bg-cyberNeon/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">{event.title || "Security Event"}</p>
                  <span className="text-xs text-gray-400 uppercase">{event.severity}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {event.city}, {event.country} | IP: {event.source_ip}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="cyber-card">
          <h3 className="text-lg font-semibold mb-3">Event Details</h3>
          {!selectedEvent ? (
            <p className="text-gray-400 text-sm">
              Click a globe marker or tracked event to inspect attribution details.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">Event ID:</span> {selectedEvent.event_id}</p>
              <p><span className="text-gray-400">Title:</span> {selectedEvent.title}</p>
              <p><span className="text-gray-400">Message:</span> {selectedEvent.message}</p>
              <p><span className="text-gray-400">Type:</span> {selectedEvent.event_type}</p>
              <p><span className="text-gray-400">Severity:</span> {selectedEvent.severity}</p>
              <p><span className="text-gray-400">Source:</span> {selectedEvent.source}</p>
              <p><span className="text-gray-400">Source IP:</span> {selectedEvent.source_ip}</p>
              <p><span className="text-gray-400">Location:</span> {selectedEvent.city}, {selectedEvent.country}</p>
              <p><span className="text-gray-400">ISP:</span> {selectedEvent.isp || "Unknown"}</p>
              <p><span className="text-gray-400">Confidence:</span> {selectedEvent.confidence || 0}/100</p>
              <p><span className="text-gray-400">Observed:</span> {new Date(selectedEvent.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

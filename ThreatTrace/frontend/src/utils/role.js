// frontend/src/utils/role.js

export const ROLE_PERSONAL = "personal";
export const ROLE_CORPORATE = "corporate";
export const ROLE_TECHNICAL = "technical";

export const ROLE_NAMES = {
  [ROLE_PERSONAL]: "Personal User",
  [ROLE_CORPORATE]: "Corporate Enterprise",
  [ROLE_TECHNICAL]: "Technical Professional",
};

export const ROLE_BADGE_COLORS = {
  [ROLE_PERSONAL]: "bg-blue-500/20 text-blue-400 border-blue-500",
  [ROLE_CORPORATE]: "bg-purple-500/20 text-purple-400 border-purple-500",
  [ROLE_TECHNICAL]: "bg-green-500/20 text-green-400 border-green-500",
};

export const FEATURE_LABELS = {
  dashboard: "Live Security Dashboard",
  ransomware: "Ransomware Scan & Detection",
  audit: "File Integrity Audit",
  alerts: "Threat Alerts Center",
  logs: "System Logs Monitor",
  settings: "Runtime Profile Settings",
  reports: "Security Reports",
  reports_export: "CSV/PDF Report Export",
  locations: "Location Tracking & Globe View",
  security_control: "Containment Security Control",
  canary_traps: "Canary Trap Management",
};

export const ROLE_FEATURES = {
  [ROLE_PERSONAL]: [
    "dashboard",
    "ransomware",
    "audit",
    "alerts",
    "logs",
    "settings",
  ],
  [ROLE_CORPORATE]: [
    "dashboard",
    "ransomware",
    "audit",
    "alerts",
    "logs",
    "settings",
    "reports",
    "reports_export",
    "locations",
  ],
  [ROLE_TECHNICAL]: [
    "dashboard",
    "ransomware",
    "audit",
    "alerts",
    "logs",
    "settings",
    "reports",
    "reports_export",
    "locations",
    "security_control",
    "canary_traps",
  ],
};

export const ROUTE_FEATURE_MAP = {
  "/dashboard": "dashboard",
  "/ransomware": "ransomware",
  "/audit": "audit",
  "/alerts": "alerts",
  "/reports": "reports",
  "/logs": "logs",
  "/settings": "settings",
  "/locations": "locations",
  "/security": "security_control",
};

/**
 * Get current user role from localStorage
 * @returns {string} - "personal", "corporate", "technical", or null
 */
export const getUserRole = () => {
  return localStorage.getItem("role");
};

/**
 * Check if user has one of the allowed roles
 * @param {string[]} allowedRoles - Array of allowed role names
 * @returns {boolean}
 */
export const hasRole = (allowedRoles) => {
  const userRole = getUserRole();
  return allowedRoles.includes(userRole);
};

/**
 * Get all features available for a role
 * @param {string | null} role
 * @returns {string[]}
 */
export const getFeaturesForRole = (role = getUserRole()) => {
  return ROLE_FEATURES[role] || [];
};

/**
 * Check if role has a feature
 * @param {string} feature
 * @param {string | null} role
 * @returns {boolean}
 */
export const hasFeature = (feature, role = getUserRole()) => {
  return getFeaturesForRole(role).includes(feature);
};

/**
 * Check if role can access route
 * @param {string} route
 * @param {string | null} role
 * @returns {boolean}
 */
export const canAccessRoute = (route, role = getUserRole()) => {
  const feature = ROUTE_FEATURE_MAP[route];
  if (!feature) {
    return false;
  }
  return hasFeature(feature, role);
};

/**
 * Get human-readable feature labels for current role
 * @param {string | null} role
 * @returns {string[]}
 */
export const getRoleCapabilityLabels = (role = getUserRole()) => {
  return getFeaturesForRole(role).map((featureKey) => FEATURE_LABELS[featureKey] || featureKey);
};

/**
 * Check if user is Personal tier
 * @returns {boolean}
 */
export const isPersonal = () => {
  return getUserRole() === "personal";
};

/**
 * Check if user is Corporate tier
 * @returns {boolean}
 */
export const isCorporate = () => {
  return getUserRole() === "corporate";
};

/**
 * Check if user is Technical tier
 * @returns {boolean}
 */
export const isTechnical = () => {
  return getUserRole() === "technical";
};

/**
 * Get role display name
 * @returns {string}
 */
export const getRoleDisplayName = () => {
  const role = getUserRole();
  return ROLE_NAMES[role] || "Unknown";
};

/**
 * Get role badge color class
 * @returns {string}
 */
export const getRoleBadgeColor = () => {
  const role = getUserRole();
  return ROLE_BADGE_COLORS[role] || "bg-gray-500/20 text-gray-400 border-gray-500";
};

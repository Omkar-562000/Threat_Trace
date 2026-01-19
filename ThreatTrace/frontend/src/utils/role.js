// frontend/src/utils/role.js

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
  const roleNames = {
    personal: "Personal User",
    corporate: "Corporate Enterprise",
    technical: "Technical Professional",
  };
  return roleNames[role] || "Unknown";
};

/**
 * Get role badge color class
 * @returns {string}
 */
export const getRoleBadgeColor = () => {
  const role = getUserRole();
  const colors = {
    personal: "bg-blue-500/20 text-blue-400 border-blue-500",
    corporate: "bg-purple-500/20 text-purple-400 border-purple-500",
    technical: "bg-green-500/20 text-green-400 border-green-500",
  };
  return colors[role] || "bg-gray-500/20 text-gray-400 border-gray-500";
};

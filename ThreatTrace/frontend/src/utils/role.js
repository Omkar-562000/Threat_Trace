export const getUserRole = () => {
  return localStorage.getItem("role") || "personal";
};

export const hasRole = (...roles) => {
  return roles.includes(getUserRole());
};

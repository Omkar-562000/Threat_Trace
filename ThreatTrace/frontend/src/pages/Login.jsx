// frontend/src/pages/Login.jsx
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/api/auth/login",
        formData
      );

      const token = res.data.token;
      const role = res.data.user?.role || "personal"; // fallback

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      navigate("/dashboard");
    } catch {
      setErrorMsg("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-cyber w-[380px] p-8 shadow-neon">
        <h2 className="text-3xl cyber-gradient-text text-center mb-6">
          Welcome Back
        </h2>

        <p className="text-gray-300 text-center mb-6">
          Login to <span className="neon-text">ThreatTrace</span>
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              className="cyber-input mt-1"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Password</label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-cyberPurple hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              name="password"
              className="cyber-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {errorMsg && (
            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cyber-btn w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Redirect Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-cyberPurple hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

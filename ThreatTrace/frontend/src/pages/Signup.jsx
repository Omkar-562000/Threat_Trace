import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "personal",
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await axios.post(
                "http://127.0.0.1:5000/api/auth/register",
                formData
            );

            setSuccessMsg("Account created successfully! Redirecting...");
            setTimeout(() => navigate("/"), 1500);

        } catch (error) {
            console.log("Signup Error:", error);
            setErrorMsg(
                error.response?.data?.message || "Registration failed. Try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">

            <div className="glass-cyber w-[400px] p-8 shadow-neon">

                <h2 className="text-3xl cyber-gradient-text text-center mb-6">
                    Create Account
                </h2>

                <p className="text-gray-300 text-center mb-6">
                    Join the <span className="neon-text">ThreatTrace</span> ecosystem
                </p>

                <form onSubmit={handleSignup} className="space-y-5">

                    {/* Name */}
                    <div>
                        <label className="text-sm text-gray-300">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={handleChange}
                            className="cyber-input mt-1"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-sm text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            className="cyber-input mt-1"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-sm text-gray-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            className="cyber-input mt-1"
                            required
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="text-sm text-gray-300">Account Type</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="cyber-input mt-1"
                            required
                        >
                            <option value="personal">Personal - Individual User</option>
                            <option value="corporate">Corporate - Big Firm/Enterprise</option>
                            <option value="technical">Technical - IT/Security Professional</option>
                        </select>
                    </div>

                    {/* Messages */}
                    {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                    {successMsg && <p className="text-green-400 text-sm text-center">{successMsg}</p>}

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="cyber-btn w-full py-2 mt-2"
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                {/* Redirect Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-300">
                        Already have an account?{" "}
                        <button
                            onClick={() => navigate("/")}
                            className="text-cyberPurple hover:underline"
                        >
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

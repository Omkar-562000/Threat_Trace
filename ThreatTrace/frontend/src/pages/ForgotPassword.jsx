import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await axios.post(
                "http://127.0.0.1:5000/api/auth/forgot-password",
                { email }
            );

            setSuccessMsg("Password reset link has been sent to your email.");
        } catch (error) {
            if (error.response?.status === 404) {
                setErrorMsg("Email is not registered.");
            } else {
                setErrorMsg("Failed to send reset link. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">

            <div className="glass-cyber w-[400px] p-8 shadow-neon">

                <h2 className="text-3xl cyber-gradient-text text-center mb-6">
                    Forgot Password
                </h2>

                <p className="text-gray-300 text-center mb-6">
                    Enter your email to receive a reset link.
                </p>

                <form onSubmit={handleReset} className="space-y-5">

                    <div>
                        <label className="text-sm text-gray-300">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="cyber-input mt-1"
                            required
                        />
                    </div>

                    {/* ERROR MESSAGE */}
                    {errorMsg && (
                        <p className="text-red-400 text-sm text-center">
                            {errorMsg}
                        </p>
                    )}

                    {/* SUCCESS MESSAGE */}
                    {successMsg && (
                        <p className="text-green-400 text-sm text-center">
                            {successMsg}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="cyber-btn w-full py-2"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-300">
                        Remember your password?{" "}
                        <button
                            onClick={() => navigate("/")}
                            className="text-cyberPurple hover:underline"
                        >
                            Back to Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

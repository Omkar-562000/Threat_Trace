import axios from "axios";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");  // Reset token from URL

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            setMessage("Please fill all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            const res = await axios.post(
                "http://127.0.0.1:5000/api/auth/reset-password",
                { token, password }
            );

            setMessage("Password reset successful!");
        } catch (err) {
            console.error(err);
            setMessage("Reset failed. Token may be invalid or expired.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cyberDark text-white px-4">

            {/* Cyberpunk glowing background */}
            <div className="absolute w-96 h-96 bg-cyberNeon/20 blur-3xl rounded-full top-10 left-10"></div>
            <div className="absolute w-96 h-96 bg-cyberPurple/30 blur-3xl rounded-full bottom-10 right-10"></div>

            {/* Glassmorphism Card */}
            <div className="relative w-full max-w-md p-8 bg-glassWhite border border-white/20 backdrop-blur-xl rounded-2xl shadow-xl">

                <h1 className="text-3xl font-bold text-center text-cyberPurple font-Orbitron mb-6">
                    Reset Your Password
                </h1>

                <p className="text-gray-300 text-center mb-4">
                    Enter your new password below.
                </p>

                <div className="flex flex-col gap-4">

                    {/* New Password */}
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-cyberNeon"
                    />

                    {/* Confirm Password */}
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 placeholder-gray-300
                                   focus:outline-none focus:ring-2 focus:ring-cyberNeon"
                    />

                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="w-full py-3 rounded-lg bg-cyberPurple hover:bg-cyberNeon transition text-white
                                   font-semibold shadow-lg shadow-cyberPurple/40"
                    >
                        Reset Password
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <p className="text-center mt-4 text-cyberNeon font-medium">{message}</p>
                )}

                {/* Back to Login */}
                <p className="text-center mt-6 text-sm text-gray-300">
                    Back to{" "}
                    <a href="/" className="text-cyberNeon underline">Login</a>
                </p>
            </div>
        </div>
    );
}

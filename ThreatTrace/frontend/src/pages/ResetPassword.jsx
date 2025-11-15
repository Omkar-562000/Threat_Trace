import axios from "axios";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

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
                `http://127.0.0.1:5000/api/auth/reset-password/${token}`,
                { new_password: password }
            );

            setMessage("Password reset successful! Redirecting...");
            setTimeout(() => navigate("/"), 1500);

        } catch (err) {
            console.log(err);
            setMessage("Reset failed. Token may be invalid or expired.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">

            <div className="glass-cyber w-[400px] p-8">

                <h2 className="text-3xl cyber-gradient-text text-center mb-6">
                    Reset Your Password
                </h2>

                <p className="text-gray-300 text-center mb-4">
                    Enter a new password.
                </p>

                <div className="space-y-4">

                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="cyber-input"
                    />

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="cyber-input"
                    />

                    <button
                        onClick={handleReset}
                        className="cyber-btn w-full"
                    >
                        Reset Password
                    </button>
                </div>

                {message && (
                    <p className="text-center mt-4 text-cyberNeon">{message}</p>
                )}
            </div>
        </div>
    );
}

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";

export default function App() {
    return (
        <BrowserRouter>
            <div className="flex">
                
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 p-4">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot" element={<ForgotPassword />} />
                        <Route path="/reset" element={<ResetPassword />} />

                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/ransomware" element={<Dashboard />} />
                        <Route path="/audit" element={<Dashboard />} />
                        <Route path="/settings" element={<Dashboard />} />
                    </Routes>
                </div>

            </div>
        </BrowserRouter>
    );
}

// src/layouts/DashboardLayout.jsx
import Sidebar from "../components/Sidebar.jsx";
import TopNavbar from "../components/TopNavbar.jsx";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (fixed) */}
      <aside className="z-40">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top navbar */}
        <header className="w-full">
          <TopNavbar />
        </header>

        {/* Page body */}
        <main className="p-6 bg-gradient-to-br from-[#0a0f1f] to-[#081120] flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

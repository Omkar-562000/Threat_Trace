// src/layouts/DashboardLayout.jsx
import Sidebar from "../components/ui/Sidebar";
import TopNavbar from "../components/ui/TopNavbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* FIXED SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT WITH LEFT PADDING (SIDEBAR WIDTH) */}
      <div className="flex flex-col flex-1 ml-64">

        {/* TOP NAVIGATION FIXED */}
        <header className="fixed top-0 left-64 right-0 z-20">
          <TopNavbar />
        </header>

        {/* PAGE CONTENT */}
        <main className="pt-20 px-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  );
}

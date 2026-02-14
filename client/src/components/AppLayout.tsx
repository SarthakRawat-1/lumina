import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/context/SidebarContext";

export function AppLayout() {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      {/* Main content */}
      <main
        className="relative z-10 transition-all duration-300 min-h-screen"
        style={{ marginLeft: collapsed ? 72 : 260 }}
      >
        <Outlet />
      </main>
    </div>
  );
}

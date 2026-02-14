import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Map,
  Video,
  PlayCircle,
  FileText,
  Presentation,
  CreditCard,
  User,
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Mic,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const NavLink = ({
  item,
  active,
  collapsed,
}: {
  item: { icon: any; label: string; href: string };
  active: boolean;
  collapsed: boolean;
}) => {
  const linkContent = (
    <Link
      to={item.href}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 mb-1 ${active
        ? "text-white bg-white/[0.02]"
        : "text-zinc-500 hover:text-zinc-300"
        }`}
    >
      {/* Active State: Electric Line Indicator */}
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute left-0 top-1 bottom-1 w-[2px] bg-sky-500 rounded-r-full shadow-[0_0_12px_rgba(14,165,233,0.6)]"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            duration: 0.2
          }}
        />
      )}

      {/* Hover State: Subtle Line Indicator (only when not active) */}
      {!active && (
        <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-sky-500/40 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}

      {/* Active State: Gradient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent rounded-md pointer-events-none transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"
          }`}
      />

      {/* Hover State: Subtle Gradient Glow (only when not active) */}
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent rounded-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}

      <div className="relative z-10">
        <item.icon
          className={`w-4 h-4 transition-colors duration-200 ${active ? "text-sky-400" : "text-zinc-500 group-hover:text-zinc-300"
            }`}
        />
      </div>

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm relative z-10 ${active ? "font-medium" : "font-normal"
            }`}
        >
          {item.label}
        </motion.span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Mic, label: "Interview Prep", href: "/interview" },
    { icon: BookOpen, label: "Courses", href: "/courses" },
    { icon: Map, label: "Roadmaps", href: "/roadmap" },
    { icon: Video, label: "Videos", href: "/video" },
    { icon: PlayCircle, label: "Learn with AI", href: "/learn" },
    { icon: FileText, label: "Notes", href: "/notes" },
    { icon: Briefcase, label: "Jobs", href: "/jobs" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      className="fixed left-0 top-0 h-screen bg-[#121212] border-r border-white/[0.06] flex flex-col z-50"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Lumina"
            className={`${collapsed ? "h-7" : "h-8"} object-contain`}
          />
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="p-2 text-white hover-glow-white bg-transparent hover:bg-transparent rounded-lg transition-all focus:outline-none"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3">
        <div className="relative">
          {/* Expandable container */}
          <div
            className={`rounded-xl overflow-hidden transition-all duration-300 ${profileOpen
              ? "bg-[#18181B] border border-white/5 shadow-2xl shadow-black/50"
              : "hover:bg-white/[0.02]"
              }`}
          >
            {/* Dropdown Menu */}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pt-2 pb-1 space-y-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-red-400 transition-colors group overflow-hidden"
                    >
                      {/* Red Hover Line */}
                      <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-red-500/40 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                      {/* Red Hover Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                      <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors relative z-10" />
                      {!collapsed && <span className="text-sm relative z-10">Sign out</span>}
                    </button>
                  </div>
                  <div className="mx-3 my-1 border-t border-white/5" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Button */}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${profileOpen ? "bg-[#18181B]" : ""
                } ${collapsed ? "justify-center" : ""}`}
            >
              <Avatar className="w-8 h-8 ring-1 ring-white/10 shadow-lg">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-sky-600 to-indigo-600 text-white text-xs font-medium">
                  {user?.name?.charAt(0) || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium text-white/90 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {user?.email}
                    </p>
                  </motion.div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${profileOpen ? "rotate-180 text-white" : ""
                      }`}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

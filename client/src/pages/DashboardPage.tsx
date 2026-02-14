import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Map,
  Video,
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Flame,
  ArrowRight,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getUserStats } from "@/lib/analyticsApi";
import { useAnalytics } from "@/hooks/useAnalytics";
import { CircularProgress } from "@/components/ui/circular-progress";


interface UserStats {
  coursesCompleted: number;
  coursesCreated: number;
  chaptersCompleted: number;
  roadmapsCreated: number;
  nodesCompleted: number;
  videosCreated: number;
  videosWatched: number;
  quizzesCompleted: number;
  flashcardSessions: number;
  totalStudyMinutes: number;
  streak: number;
  weeklyActivity: { day: string; count: number }[];
  quizScores: { date: string; score: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useAnalytics();

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getUserStats();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Format study time
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const quickActions = [
    {
      icon: BookOpen,
      label: "New Course",
      desc: "AI Curriculum",
      href: "/courses/create",
      color: "emerald",
      gradient: "from-emerald-500 to-teal-500",
      delay: 0.1
    },
    {
      icon: Map,
      label: "New Roadmap",
      desc: "Career Path",
      href: "/roadmap",
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500",
      delay: 0.2
    },
    {
      icon: Video,
      label: "New Video",
      desc: "Analysis",
      href: "/video",
      color: "red",
      gradient: "from-red-500 to-orange-500",
      delay: 0.3
    },
    {
      icon: FileText,
      label: "New Note",
      desc: "Documentation",
      href: "/notes",
      color: "amber",
      gradient: "from-amber-500 to-yellow-500",
      delay: 0.4
    },
  ];

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    delay,
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: string;
    delay: number;
  }) => {
    // Map color names to tailwind classes
    const colorMap: Record<string, string> = {
      violet: "text-violet-400 bg-violet-500/10 border-violet-500/20 group-hover:border-violet-500/50",
      cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/50",
      amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/50",
      emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/50",
    };

    const theme = colorMap[color] || colorMap.violet;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`relative overflow-hidden rounded-2xl bg-[#18181B] border border-white/5 p-6 group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${theme.split(' ')[1]} backdrop-blur-sm border ${theme.split(' ')[2]}`}>
            <Icon className={`w-6 h-6 ${theme.split(' ')[0]}`} />
          </div>
          {color === 'amber' && (
            <div className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 fill-amber-500" />
              Hot
            </div>
          )}
        </div>

        <div>
          <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">
            {isLoading ? (
              <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
            ) : value}
          </h3>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wide">
            {title}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
          <span className="text-xs text-zinc-600 font-mono">{subtitle}</span>
        </div>

        {/* Hover Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.split(' ')[3]?.replace('border-', 'from-').replace('/50', '/5')} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] font-outfit text-white relative overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
                    linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase">System Online</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-2">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">{user?.name?.split(" ")[0] || 'User'}</span>
            </h1>
            <p className="text-zinc-400 text-lg">
              Your command center is ready. What shall we achieve today?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-right hidden md:block"
          >
            <div className="text-4xl font-bold text-white font-mono opacity-80">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div className="text-cyan-500 text-sm font-bold uppercase tracking-widest mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: action.delay }}
            >
              <Link
                to={action.href}
                className="group relative h-24 bg-[#18181B] border border-white/5 hover:border-white/20 rounded-xl flex items-center px-6 overflow-hidden transition-all hover:-translate-y-1"
              >
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className="relative z-10 flex items-center gap-4 w-full">
                  <div className={`p-3 rounded-lg bg-[#121212] border border-white/10 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-400 group-hover:text-${action.color}-500 transition-colors`} />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg leading-tight">{action.label}</div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors">{action.desc}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600 ml-auto group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Streak"
            value={stats?.streak || 0}
            subtitle="Consecutive Days"
            icon={Flame}
            color="amber"
            delay={0.5}
          />
          <StatCard
            title="Focus Time"
            value={formatStudyTime(stats?.totalStudyMinutes || 0)}
            subtitle="This Month"
            icon={Clock}
            color="emerald"
            delay={0.6}
          />
          <StatCard
            title="Projects"
            value={(stats?.coursesCreated || 0) + (stats?.roadmapsCreated || 0)}
            subtitle="Total Created"
            icon={TrendingUp}
            color="violet"
            delay={0.7}
          />
          <StatCard
            title="Knowledge"
            value={stats?.nodesCompleted || 0}
            subtitle="Nodes Explored"
            icon={Sparkles}
            color="cyan"
            delay={0.8}
          />
        </div>

        {/* Dashboard Main Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="lg:col-span-2 bg-[#18181B] border border-white/5 rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-500" />
                  Learning Velocity
                </h3>
                <p className="text-zinc-500 text-sm mt-1">Activity metrics over the last 7 days</p>
              </div>
            </div>

            {/* Grid Effect inside chart Card */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#8b5cf6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <div className="h-[300px] w-full relative z-10">
              {stats?.weeklyActivity && stats.weeklyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyActivity}>
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="rgba(255,255,255,0.2)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "rgba(139, 92, 246, 0.2)",
                        borderRadius: "8px",
                        boxShadow: "0 0 20px rgba(139, 92, 246, 0.1)"
                      }}
                      itemStyle={{ color: "#fff" }}
                      cursor={{ stroke: "rgba(139, 92, 246, 0.2)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#activityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                  <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                  <p>No activity data available yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Status / Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="space-y-4"
          >
            <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 h-full">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">System Distribution</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <CircularProgress
                    value={Math.min((stats?.coursesCreated || 0) * 10, 100)}
                    text={stats?.coursesCreated || 0}
                    label="Courses"
                    color="text-emerald-500"
                    size={90}
                    strokeWidth={6}
                  />
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <CircularProgress
                    value={Math.min((stats?.roadmapsCreated || 0) * 20, 100)}
                    text={stats?.roadmapsCreated || 0}
                    label="Roadmaps"
                    color="text-cyan-500"
                    size={90}
                    strokeWidth={6}
                  />
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <CircularProgress
                    value={Math.min((stats?.videosCreated || 0) * 10, 100)}
                    text={stats?.videosCreated || 0}
                    label="Videos"
                    color="text-red-500"
                    size={90}
                    strokeWidth={6}
                  />
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] rounded-xl border border-white/5">
                  <CircularProgress
                    value={Math.min((stats?.quizzesCompleted || 0) * 5, 100)}
                    text={stats?.quizzesCompleted || 0}
                    label="Quizzes"
                    color="text-violet-500"
                    size={90}
                    strokeWidth={6}
                  />
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}

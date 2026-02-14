import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Book, Clock, Sparkles, Layers, Search, GraduationCap, Loader2 } from "lucide-react";
import { courseApi, type Course } from "@/lib/courseApi";

const statusColors = {
  creating: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ready: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const difficultyColors = {
  beginner: "text-emerald-400",
  intermediate: "text-blue-400",
  advanced: "text-purple-400",
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
    const interval = setInterval(() => {
      if (courses.some((c) => c.status === "creating")) {
        loadCourses();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [courses.length]);

  const loadCourses = async () => {
    try {
      const data = await courseApi.getCourses();
      setCourses(data.courses);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#121212] overflow-y-auto font-outfit text-white">
      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
                        linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                    `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 w-full min-h-screen flex flex-col p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6"
        >
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">
              Learning Courses
            </h1>
            <p className="text-zinc-400 text-lg">
              AI-generated personalized learning paths for masters.
            </p>
          </div>
        </motion.div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* 1. Existing Courses */}
            <AnimatePresence mode="popLayout">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() =>
                    course.status === "ready" && navigate(`/courses/${course.id}`)
                  }
                  className={`group relative h-full min-h-[300px] bg-[#18181B] border border-white/5 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 ${course.status === "ready" ? "cursor-pointer hover:border-emerald-500/50" : "cursor-default opacity-80"
                    }`}
                >
                  {/* Visual Top Section */}
                  <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden group-hover:brightness-110 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <GraduationCap className="w-16 h-16 text-zinc-600 group-hover:text-emerald-500/80 transition-colors duration-300" />



                    {/* Creating Progress Bar */}
                    {course.status === "creating" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 30, repeat: Infinity }}
                          className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-semibold text-xl line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {course.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[course.status]}`}>
                        {course.status}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-500 mb-6 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5 font-sans">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.time_hours}h</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-sans">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{course.chapter_count} Chapters</span>
                      </div>
                      <div className={`ml-auto capitalize ${difficultyColors[course.difficulty as keyof typeof difficultyColors]}`}>
                        {course.difficulty}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 2. "Start New Course" Card */}
            <motion.button
              layout
              onClick={() => navigate("/courses/create")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative h-full min-h-[300px] bg-[#18181B] border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 text-left"
            >
              <div className="flex-1 w-full bg-[#222228] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 group-hover:bg-emerald-600 group-hover:border-emerald-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow-emerald">
                  <Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="p-6 border-t border-white/5 bg-[#18181B] relative z-20">
                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-emerald-400 transition-colors">Create New Course</h3>
                <p className="text-sm text-zinc-500">AI-generated personalized path</p>
              </div>
            </motion.button>

            {/* 3. Ghost Slots */}
            {courses.length === 0 && (
              <>
                <div className="h-full min-h-[300px] rounded-2xl border border-white/5 bg-[#121212] opacity-30 flex flex-col overflow-hidden pointer-events-none grayscale">
                  <div className="flex-1 w-full bg-[#18181B/50] relative">
                    <div className="absolute inset-x-12 top-12 bottom-0 bg-[#222228] rounded-t-xl opacity-50" />
                  </div>
                  <div className="p-6 border-t border-white/5 bg-[#121212]">
                    <div className="h-5 w-3/4 bg-white/10 rounded mb-3" />
                    <div className="h-4 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>

                <div className="h-full min-h-[300px] rounded-2xl border border-white/5 bg-[#121212] opacity-20 flex flex-col overflow-hidden pointer-events-none grayscale hidden md:flex">
                  <div className="flex-1 w-full bg-[#18181B/50] relative">
                    <div className="absolute inset-x-12 top-12 bottom-0 bg-[#222228] rounded-t-xl opacity-50" />
                  </div>
                  <div className="p-6 border-t border-white/5 bg-[#121212]">
                    <div className="h-5 w-2/3 bg-white/10 rounded mb-3" />
                    <div className="h-4 w-1/3 bg-white/5 rounded" />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

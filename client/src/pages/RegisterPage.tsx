import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      setIsLoading(true);

      try {
        await register(email, password, name);
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Registration failed");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, password, confirmPassword, register, navigate]
  );

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center pt-14 px-4 font-sans text-white relative">
      {/* Top Left Logo */}
      <div className="absolute top-8 left-8">
        <Link to="/" className="inline-block transition-transform hover:scale-105">
          <img src="/logo.png" alt="Lumina" className="h-8 w-auto" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px]"
      >
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            Create account
          </h1>
          <p className="text-zinc-400 text-base">
            Start your learning journey
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-500/10 border-red-500/20 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-[#0A0A0A] border-white/10 text-white placeholder:text-zinc-600 rounded-md focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50 transition-all font-medium"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-[#0A0A0A] border-white/10 text-white placeholder:text-zinc-600 rounded-md focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50 transition-all font-medium"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-zinc-600 rounded-md focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50 transition-all font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 pr-10 bg-[#0A0A0A] border-white/10 text-white placeholder:text-zinc-600 rounded-md focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50 transition-all font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="px-8 h-11 btn-green font-bold text-sm min-w-[140px] rounded-lg border-0"
            >
              {isLoading ? "Creating account..." : "Create account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-zinc-500 text-sm mb-4">
            Or continue with
          </p>
          <Button
            onClick={loginWithGoogle}
            variant="outline"
            className="h-11 px-6 btn-google border-0 text-white hover:text-white transition-all rounded-lg font-medium"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-zinc-500 mt-8 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-sky-400 hover:text-sky-300 font-medium hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

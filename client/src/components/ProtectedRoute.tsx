import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white/60">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login with return path
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

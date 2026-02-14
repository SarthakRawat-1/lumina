import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

/**
 * OAuth callback page - handles the token from Google OAuth
 */
export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login?error=' + error);
            return;
        }

        if (token) {
            // Store token and redirect to dashboard
            localStorage.setItem('lumina_token', token);
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/60">Completing sign in...</p>
            </div>
        </div>
    );
}

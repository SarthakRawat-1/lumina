import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, getAuthHeader } from '@/context/AuthContext';
import { trackPageView, trackStudySession } from '@/lib/analyticsApi';

/**
 * Hook for automatic analytics tracking.
 * - Tracks page views on route changes
 * - Tracks study session duration when leaving page
 */
export function useAnalytics() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const sessionStartRef = useRef<number>(Date.now());

    // Track page views on route change
    useEffect(() => {
        if (isAuthenticated) {
            trackPageView(location.pathname);
            sessionStartRef.current = Date.now();
        }
    }, [location.pathname, isAuthenticated]);

    // Track study session on page leave
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleBeforeUnload = () => {
            const durationMinutes = Math.floor((Date.now() - sessionStartRef.current) / 60000);
            if (durationMinutes >= 1) {
                // Use sendBeacon for reliable tracking on page close
                const url = `${import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3002/api'}/analytics/track`;
                const headers = {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                };

                // Create a simple fetch request to get the headers and then use sendBeacon
                // Since sendBeacon doesn't support custom headers, we'll send a regular request
                const body = JSON.stringify({
                    eventType: 'study_session',
                    metadata: { duration: durationMinutes },
                });

                // Use fetch instead of sendBeacon since we need authentication headers
                fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: body,
                }).catch(() => {
                    // If fetch fails, we could potentially use sendBeacon as a fallback
                    // but it won't have authentication
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isAuthenticated]);

    return {
        trackPageView,
        trackStudySession,
    };
}

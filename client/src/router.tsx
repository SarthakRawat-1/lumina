import { createBrowserRouter } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

// Lazy load pages
const CollaborationPage = lazy(() => import("@/pages/CollaborationPage"));
const CoursesPage = lazy(() => import("@/pages/CoursesPage"));
const CreateCoursePage = lazy(() => import("@/pages/CreateCoursePage"));
const CourseViewPage = lazy(() => import("@/pages/CourseViewPage"));
const ChapterViewPage = lazy(() => import("@/pages/ChapterViewPage"));
const RoadmapsListPage = lazy(() => import("@/pages/RoadmapsListPage"));
const RoadmapCreatePage = lazy(() => import("@/pages/RoadmapCreatePage"));
const RoadmapViewPage = lazy(() => import("@/pages/RoadmapViewPage"));
const VideoLibraryPage = lazy(() => import("@/pages/VideoLibraryPage"));
const VideoCreatePage = lazy(() => import("@/pages/VideoGeneratorPage"));
const VideoViewPage = lazy(() => import("@/pages/VideoViewPage"));
const LearnPage = lazy(() => import("@/pages/LearnPage"));
const LearnVideoPage = lazy(() => import("@/pages/LearnVideoPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const NotesPage = lazy(() => import("@/pages/NotesPage"));
const JobCreatePage = lazy(() => import("@/pages/JobCreatePage"));
const JobHistoryPage = lazy(() => import("@/pages/JobHistoryPage"));
const JobResultsPage = lazy(() => import("@/pages/JobResultsPage"));
const InterviewSetup = lazy(() => import('@/pages/Interview/Setup'));
const InterviewRoom = lazy(() => import('@/pages/Interview/Room'));
const InterviewReport = lazy(() => import('@/pages/Interview/Report'));
const InterviewListPage = lazy(() => import('@/pages/Interview/InterviewListPage'));

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f]">
    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
    <p className="text-purple-400 font-medium animate-pulse">Loading... please wait</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  // Auth routes
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: "/auth/callback",
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthCallbackPage />
      </Suspense>
    ),
  },
  // App routes with sidebar layout
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/notes/:documentId",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CollaborationPage />
          </Suspense>
        ),
      },
      {
        path: "/courses",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CoursesPage />
          </Suspense>
        ),
      },
      {
        path: "/courses/create",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CreateCoursePage />
          </Suspense>
        ),
      },
      {
        path: "/courses/:courseId",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <CourseViewPage />
          </Suspense>
        ),
      },
      {
        path: "/courses/:courseId/chapters/:chapterId",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ChapterViewPage />
          </Suspense>
        ),
      },
      {
        path: "/roadmap",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <RoadmapsListPage />
          </Suspense>
        ),
      },
      {
        path: "/roadmap/new",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <RoadmapCreatePage />
          </Suspense>
        ),
      },
      {
        path: "/roadmap/:id",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <RoadmapViewPage />
          </Suspense>
        ),
      },
      {
        path: "/video",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <VideoLibraryPage />
          </Suspense>
        ),
      },
      {
        path: "/video/new",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <VideoCreatePage />
          </Suspense>
        ),
      },
      {
        path: "/video/:videoId",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <VideoViewPage />
          </Suspense>
        ),
      },
      {
        path: "/learn",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LearnPage />
          </Suspense>
        ),
      },
      {
        path: "/notes",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <NotesPage />
          </Suspense>
        ),
      },
      {
        path: "/learn/:videoId",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <LearnVideoPage />
          </Suspense>
        ),
      },
      {
        path: "/jobs",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <JobHistoryPage />
          </Suspense>
        ),
      },
      {
        path: "/jobs/new",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <JobCreatePage />
          </Suspense>
        ),
      },
      {
        path: "/jobs/:searchId",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <JobResultsPage />
          </Suspense>
        ),
      },
      {
        path: "/interview",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InterviewListPage />
          </Suspense>
        ),
      },
      {
        path: "/interview/new",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InterviewSetup />
          </Suspense>
        ),
      },
      {
        path: "/interview/room",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InterviewRoom />
          </Suspense>
        ),
      },
      {
        path: "/interview/report/:id",
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <InterviewReport />
          </Suspense>
        ),
      },
    ],
  },
]);

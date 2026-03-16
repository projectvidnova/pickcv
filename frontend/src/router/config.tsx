
import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { getSubdomain, type SubdomainType } from '../utils/subdomain';

const Home = lazy(() => import('../pages/home/page'));
const Jobs = lazy(() => import('../pages/jobs/page'));
const JobDetail = lazy(() => import('../pages/jobs/[id]/page'));
const Onboarding = lazy(() => import('../pages/onboarding/page'));
const OptimizedResume = lazy(() => import('../pages/optimized-resume/page'));
const ResumeComparison = lazy(() => import('../pages/resume-comparison/page'));
const ResumeBuilder = lazy(() => import('../pages/resume-builder/page'));
const Profile = lazy(() => import('../pages/profile/page'));
const AuthCallback = lazy(() => import('../pages/auth/callback'));
const About = lazy(() => import('../pages/about/page'));
const Careers = lazy(() => import('../pages/careers/page'));
const Contact = lazy(() => import('../pages/contact/page'));
const CollegeRegister = lazy(() => import('../pages/college/register/page'));
const CollegeLogin = lazy(() => import('../pages/college/login/page'));
const CollegeOnboarding = lazy(() => import('../pages/college/onboarding/page'));
const CollegePendingApproval = lazy(() => import('../pages/college/pending-approval/page'));
const CollegeDashboard = lazy(() => import('../pages/college-dashboard/page'));
const AdminLogin = lazy(() => import('../pages/admin/login/page'));
const AdminColleges = lazy(() => import('../pages/admin/colleges/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

// ─── Admin portal routes (admin.pickcv.com) ───
const adminRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AdminLogin />,
  },
  {
    path: '/login',
    element: <AdminLogin />,
  },
  {
    path: '/colleges',
    element: <AdminColleges />,
  },
  // Legacy paths still work
  {
    path: '/admin/login',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/admin/colleges',
    element: <Navigate to="/colleges" replace />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

// ─── Institution portal routes (institution.pickcv.com) ───
const institutionRoutes: RouteObject[] = [
  {
    path: '/',
    element: <CollegeLogin />,
  },
  {
    path: '/login',
    element: <CollegeLogin />,
  },
  {
    path: '/register',
    element: <CollegeRegister />,
  },
  {
    path: '/onboarding',
    element: <CollegeOnboarding />,
  },
  {
    path: '/pending-approval',
    element: <CollegePendingApproval />,
  },
  {
    path: '/dashboard',
    element: <CollegeDashboard />,
  },
  // Legacy paths still work
  {
    path: '/college/login',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/college/register',
    element: <Navigate to="/register" replace />,
  },
  {
    path: '/college/onboarding',
    element: <Navigate to="/onboarding" replace />,
  },
  {
    path: '/college/pending-approval',
    element: <Navigate to="/pending-approval" replace />,
  },
  {
    path: '/college-dashboard',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

// ─── Main site routes (pickcv.com) ───
const mainRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/jobs',
    element: <Jobs />,
  },
  {
    path: '/jobs/:id',
    element: <JobDetail />,
  },
  {
    path: '/onboarding',
    element: <Onboarding />,
  },
  {
    path: '/optimized-resume',
    element: <OptimizedResume />,
  },
  {
    path: '/resume-comparison',
    element: <ResumeComparison />,
  },
  {
    path: '/resume-builder',
    element: <ResumeBuilder />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/careers',
    element: <Careers />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  // College & admin routes still accessible from main site
  {
    path: '/college/register',
    element: <CollegeRegister />,
  },
  {
    path: '/college/login',
    element: <CollegeLogin />,
  },
  {
    path: '/college/onboarding',
    element: <CollegeOnboarding />,
  },
  {
    path: '/college/pending-approval',
    element: <CollegePendingApproval />,
  },
  {
    path: '/college-dashboard',
    element: <CollegeDashboard />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin/colleges',
    element: <AdminColleges />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

const routeMap: Record<SubdomainType, RouteObject[]> = {
  admin: adminRoutes,
  institution: institutionRoutes,
  main: mainRoutes,
};

const routes: RouteObject[] = routeMap[getSubdomain()];

export default routes;

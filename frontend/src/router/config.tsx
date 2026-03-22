
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
const VerifyEmail = lazy(() => import('../pages/auth/verify-email'));
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
const AdminPayments = lazy(() => import('../pages/admin/payments/page'));
const AdminRecruiters = lazy(() => import('../pages/admin/recruiters/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const ForRecruitersPage = lazy(() => import('../pages/for-recruiters/page'));
const ForCollegesPage = lazy(() => import('../pages/for-colleges/page'));

// ─── Recruiter portal pages ───
const RecruiterLogin = lazy(() => import('../pages/recruiter/login/page'));
const RecruiterRegister = lazy(() => import('../pages/recruiter/register/page'));
const RecruiterVerifyEmail = lazy(() => import('../pages/recruiter/verify-email/page'));
const RecruiterVerifyEmailSent = lazy(() => import('../pages/recruiter/verify-email-sent/page'));
const RecruiterPendingApproval = lazy(() => import('../pages/recruiter/pending-approval/page'));
const RecruiterDashboard = lazy(() => import('../pages/recruiter/dashboard/page'));
const RecruiterJobs = lazy(() => import('../pages/recruiter/jobs/page'));
const RecruiterNewJob = lazy(() => import('../pages/recruiter/jobs/new/page'));
const RecruiterJobDetail = lazy(() => import('../pages/recruiter/jobs/[id]/page'));
const RecruiterInterviewers = lazy(() => import('../pages/recruiter/interviewers/page'));
const RecruiterOfferTemplates = lazy(() => import('../pages/recruiter/offer-templates/page'));
const RecruiterOffers = lazy(() => import('../pages/recruiter/offers/page'));
const RecruiterOfferView = lazy(() => import('../pages/recruiter/offer/[id]/page'));
const RecruiterAcceptInvite = lazy(() => import('../pages/recruiter/accept-invite/page'));

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
  {
    path: '/payments',
    element: <AdminPayments />,
  },
  {
    path: '/recruiters',
    element: <AdminRecruiters />,
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
    path: '/admin/payments',
    element: <Navigate to="/payments" replace />,
  },
  {
    path: '/admin/recruiters',
    element: <Navigate to="/recruiters" replace />,
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

// ─── Recruiter portal routes (recruiters.pickcv.com) ───
const recruiterRoutes: RouteObject[] = [
  {
    path: '/',
    element: <RecruiterLogin />,
  },
  {
    path: '/login',
    element: <RecruiterLogin />,
  },
  {
    path: '/register',
    element: <RecruiterRegister />,
  },
  {
    path: '/verify-email',
    element: <RecruiterVerifyEmail />,
  },
  {
    path: '/verify-email-sent',
    element: <RecruiterVerifyEmailSent />,
  },
  {
    path: '/pending-approval',
    element: <RecruiterPendingApproval />,
  },
  {
    path: '/dashboard',
    element: <RecruiterDashboard />,
  },
  {
    path: '/jobs',
    element: <RecruiterJobs />,
  },
  {
    path: '/jobs/new',
    element: <RecruiterNewJob />,
  },
  {
    path: '/jobs/:id',
    element: <RecruiterJobDetail />,
  },
  {
    path: '/jobs/:id/edit',
    element: <RecruiterNewJob />,
  },
  {
    path: '/interviewers',
    element: <RecruiterInterviewers />,
  },
  {
    path: '/offer-templates',
    element: <RecruiterOfferTemplates />,
  },
  {
    path: '/offers',
    element: <RecruiterOffers />,
  },
  {
    path: '/offer/:id',
    element: <RecruiterOfferView />,
  },
  {
    path: '/accept-invite',
    element: <RecruiterAcceptInvite />,
  },
  // Legacy paths (redirect /recruiter/* → short paths)
  {
    path: '/recruiter/login',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/recruiter/register',
    element: <Navigate to="/register" replace />,
  },
  {
    path: '/recruiter/dashboard',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/recruiter/jobs',
    element: <Navigate to="/jobs" replace />,
  },
  {
    path: '/recruiter/jobs/new',
    element: <Navigate to="/jobs/new" replace />,
  },
  {
    path: '/recruiter/interviewers',
    element: <Navigate to="/interviewers" replace />,
  },
  {
    path: '/recruiter/offer-templates',
    element: <Navigate to="/offer-templates" replace />,
  },
  {
    path: '/recruiter/offers',
    element: <Navigate to="/offers" replace />,
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
    path: '/verify-email',
    element: <VerifyEmail />,
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
  {
    path: '/for-recruiters',
    element: <ForRecruitersPage />,
  },
  {
    path: '/for-colleges',
    element: <ForCollegesPage />,
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
    path: '/admin/payments',
    element: <AdminPayments />,
  },
  {
    path: '/admin/recruiters',
    element: <AdminRecruiters />,
  },
  // ─── Recruiter Portal Routes ───
  {
    path: '/recruiter/login',
    element: <RecruiterLogin />,
  },
  {
    path: '/recruiter/register',
    element: <RecruiterRegister />,
  },
  {
    path: '/recruiter/verify-email',
    element: <RecruiterVerifyEmail />,
  },
  {
    path: '/recruiter/verify-email-sent',
    element: <RecruiterVerifyEmailSent />,
  },
  {
    path: '/recruiter/pending-approval',
    element: <RecruiterPendingApproval />,
  },
  {
    path: '/recruiter/dashboard',
    element: <RecruiterDashboard />,
  },
  {
    path: '/recruiter/jobs',
    element: <RecruiterJobs />,
  },
  {
    path: '/recruiter/jobs/new',
    element: <RecruiterNewJob />,
  },
  {
    path: '/recruiter/jobs/:id',
    element: <RecruiterJobDetail />,
  },
  {
    path: '/recruiter/jobs/:id/edit',
    element: <RecruiterNewJob />,
  },
  {
    path: '/recruiter/interviewers',
    element: <RecruiterInterviewers />,
  },
  {
    path: '/recruiter/offer-templates',
    element: <RecruiterOfferTemplates />,
  },
  {
    path: '/recruiter/offers',
    element: <RecruiterOffers />,
  },
  {
    path: '/recruiter/offer/:id',
    element: <RecruiterOfferView />,
  },
  {
    path: '/recruiter/accept-invite',
    element: <RecruiterAcceptInvite />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

const routeMap: Record<SubdomainType, RouteObject[]> = {
  admin: adminRoutes,
  institution: institutionRoutes,
  recruiter: recruiterRoutes,
  main: mainRoutes,
};

const routes: RouteObject[] = routeMap[getSubdomain()];

export default routes;

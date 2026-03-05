
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Home = lazy(() => import('../pages/home/page'));
const Jobs = lazy(() => import('../pages/jobs/page'));
const JobDetail = lazy(() => import('../pages/jobs/[id]/page'));
const Onboarding = lazy(() => import('../pages/onboarding/page'));
const OptimizedResume = lazy(() => import('../pages/optimized-resume/page'));
const ResumeBuilder = lazy(() => import('../pages/resume-builder/page'));
const Profile = lazy(() => import('../pages/profile/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
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
    path: '/resume-builder',
    element: <ResumeBuilder />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;

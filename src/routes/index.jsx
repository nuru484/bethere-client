//src/routes/index.jsx
import { Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
// lazy() with stale-deploy recovery: a failed chunk import reloads once to
// pick up the new build instead of stranding the user on an error page.
import { lazyWithRetry as lazy } from "@/lib/lazy-with-retry";
// Eagerly imported: it IS the fallback shown while lazy chunks load.
import BeThereLoader from "@/components/ui/BeThereLoader";
import ProtectedRoutes from "./ProtectedRoutes";
import RequireRole from "./RequireRole";
// Small always-needed shells stay static: the router needs them synchronously
// and they are tiny. ErrorPage/NotFoundPage are error surfaces we never want to
// have to lazy-load, and Layout wraps every dashboard route.
import ErrorPage from "@/pages/ErrorPage";
import NotFoundPage from "@/pages/NotFoundPage";
import Layout from "@/components/Layout";

// The landing page (which pulls in lenis) and the auth pages are code-split so
// an authenticated user going straight to /dashboard never downloads the
// marketing page, and a first-time visitor on / never downloads auth code.
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));

// Dashboard pages are code-split so the initial bundle stays small.
const DashboardRedirect = lazy(() =>
  import("@/pages/dashboard/DashboardRedirect")
);
const EventsPage = lazy(() => import("@/pages/dashboard/events/Events"));
const EventDetailsPage = lazy(() =>
  import("@/pages/dashboard/events/EventDetailsPage")
);
const CreateEventPage = lazy(() =>
  import("@/pages/dashboard/events/CreateEventPage")
);
const UpdateEventPage = lazy(() =>
  import("@/pages/dashboard/events/UpdateEventPage")
);
const VenueCodePage = lazy(() =>
  import("@/pages/dashboard/events/VenueCodePage")
);
const AddUserFaceScan = lazy(() =>
  import("@/pages/dashboard/AddUserFaceScan")
);
const EventSignIn = lazy(() =>
  import("@/pages/dashboard/attendance/EventSignIn")
);
const EventSignOut = lazy(() =>
  import("@/pages/dashboard/attendance/EventSignOut")
);
const EventAttendancePage = lazy(() =>
  import("@/pages/dashboard/attendance/EventAttendance")
);
const UserEventAttendancePage = lazy(() =>
  import("@/pages/dashboard/attendance/UserEventAttendance")
);
const UserAttendancePage = lazy(() =>
  import("@/pages/dashboard/attendance/UserAttendance")
);
const AttendanceReportsPage = lazy(() =>
  import("@/pages/dashboard/attendance/ReportsPage")
);
const ReviewPage = lazy(() => import("@/pages/dashboard/review/ReviewPage"));
const Userspage = lazy(() => import("@/pages/dashboard/users/Users"));
const AdminsPage = lazy(() => import("@/pages/dashboard/admins/Admins"));
const AddAdminPage = lazy(() =>
  import("@/pages/dashboard/admins/AddAdminPage")
);
const AddUserPage = lazy(() => import("@/pages/dashboard/users/AddUserPage"));
const UserProfilePage = lazy(() =>
  import("@/pages/dashboard/users/UserProfilePage")
);

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <BeThereLoader />
  </div>
);

const page = (element) => (
  <Suspense fallback={<PageFallback />}>{element}</Suspense>
);

const adminPage = (element) => (
  <Suspense fallback={<PageFallback />}>
    <RequireRole role="ADMIN">{element}</RequireRole>
  </Suspense>
);

const Routes = () => {
  const protectedRoutes = [
    {
      path: "/",
      element: <ProtectedRoutes />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "/dashboard",
          element: <Layout />,
          errorElement: <ErrorPage />,
          children: [
            { index: true, element: page(<DashboardRedirect />) },
            {
              path: "/dashboard/events",
              element: page(<EventsPage />),
            },
            {
              path: "/dashboard/events/:eventId",
              element: page(<EventDetailsPage />),
            },
            {
              path: "/dashboard/events/create",
              element: adminPage(<CreateEventPage />),
            },
            {
              path: "/dashboard/events/:eventId/edit",
              element: adminPage(<UpdateEventPage />),
            },
            {
              path: "/dashboard/events/:eventId/attendance",
              element: adminPage(<EventAttendancePage />),
            },
            {
              path: "/dashboard/events/:eventId/venue-code",
              element: adminPage(<VenueCodePage />),
            },
            {
              path: "/dashboard/attendance/user/:userId/event/:eventId",
              element: page(<UserEventAttendancePage />),
            },
            {
              path: "/dashboard/attendance/:userId",
              element: page(<UserAttendancePage />),
            },
            {
              path: "/dashboard/users",
              element: adminPage(<Userspage />),
            },
            {
              path: "/dashboard/admins",
              element: adminPage(<AdminsPage />),
            },
            {
              path: "/dashboard/admins/add",
              element: adminPage(<AddAdminPage />),
            },
            {
              path: "/dashboard/review",
              element: adminPage(<ReviewPage />),
            },
            {
              path: "/dashboard/users/:userId/profile",
              element: page(<UserProfilePage />),
            },
            {
              path: "/dashboard/users/create",
              element: adminPage(<AddUserPage />),
            },
            {
              path: "/dashboard/add-facescan",
              element: page(<AddUserFaceScan />),
            },
            {
              path: "/dashboard/events/:eventId/attendance-in",
              element: page(<EventSignIn />),
            },
            {
              path: "/dashboard/events/:eventId/attendance-out",
              element: page(<EventSignOut />),
            },
            {
              path: "/dashboard/attendance/reports",
              element: adminPage(<AttendanceReportsPage />),
            },
          ],
        },
      ],
    },
  ];

  const publicRoutes = [
    {
      path: "/",
      element: page(<LandingPage />),
      errorElement: <ErrorPage />,
    },

    {
      path: "/login",
      element: page(<LoginPage />),
      errorElement: <ErrorPage />,
    },

    {
      path: "/forgot-password",
      element: page(<ForgotPasswordPage />),
      errorElement: <ErrorPage />,
    },

    {
      path: "/reset-password",
      element: page(<ResetPasswordPage />),
      errorElement: <ErrorPage />,
    },

    // Catch-all 404: any URL no other branch claims (including unknown
    // /dashboard/* paths, which fall out of the protected branch).
    {
      path: "*",
      element: <NotFoundPage />,
      errorElement: <ErrorPage />,
    },
  ];

  const router = createBrowserRouter([...publicRoutes, ...protectedRoutes]);

  return <RouterProvider router={router} />;
};

export default Routes;

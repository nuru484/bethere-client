//src/routes/index.jsx
import { lazy, Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import RequireRole from "./RequireRole";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ErrorPage from "@/pages/ErrorPage";
import NotFoundPage from "@/pages/NotFoundPage";
import Layout from "@/components/Layout";

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
    <div
      className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"
      role="status"
      aria-label="Loading page"
    />
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
      element: <LandingPage />,
      errorElement: <ErrorPage />,
    },

    {
      path: "/login",
      element: <LoginPage />,
      errorElement: <ErrorPage />,
    },

    {
      path: "/forgot-password",
      element: <ForgotPasswordPage />,
      errorElement: <ErrorPage />,
    },

    {
      path: "/reset-password",
      element: <ResetPasswordPage />,
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

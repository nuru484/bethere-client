//src/routes/index.jsx
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ErrorPage from "@/pages/ErrorPage";
import Layout from "@/components/Layout";
import CreateEventPage from "@/pages/dashboard/events/CreateEventPage";
import UpdateEventPage from "@/pages/dashboard/events/UpdateEventPage";
import AddUserFaceScan from "@/pages/dashboard/AddUserFaceScan";
import EventSignIn from "@/pages/dashboard/attendance/EventSignIn";
import EventSignOut from "@/pages/dashboard/attendance/EventSignOut";
import EventAttendancePage from "@/pages/dashboard/attendance/EventAttendance";
import UserEventAttendancePage from "@/pages/dashboard/attendance/UserEventAttendance";
import Userspage from "@/pages/dashboard/users/Users";
import AddUserPage from "@/pages/dashboard/users/AddUserPage";
import DashboardRedirect from "@/pages/dashboard/DashboardRedirect";
import UserAttendancePage from "@/pages/dashboard/attendance/UserAttendance";
import EventDetailsPage from "@/pages/dashboard/events/EventDetailsPage";
import EventsPage from "@/pages/dashboard/events/Events";
import UserProfilePage from "@/pages/dashboard/users/UserProfilePage";
import AttendanceReportsPage from "@/pages/dashboard/attendance/ReportsPage";

const Routes = () => {
  const protectedRoutes = [
    {
      path: "/",
      element: <ProtectedRoutes />,
      children: [
        {
          path: "/dashboard",
          element: <Layout />,
          errorElement: <ErrorPage />,
          children: [
            { index: true, element: <DashboardRedirect /> },
            {
              path: "/dashboard/events",
              element: <EventsPage />,
            },
            {
              path: "/dashboard/events/:eventId",
              element: <EventDetailsPage />,
            },
            {
              path: "/dashboard/events/create",
              element: <CreateEventPage />,
            },
            {
              path: "/dashboard/events/:eventId/edit",
              element: <UpdateEventPage />,
            },
            {
              path: "/dashboard/events/:eventId/attendance",
              element: <EventAttendancePage />,
            },
            {
              path: "/dashboard/attendance/user/:userId/event/:eventId",
              element: <UserEventAttendancePage />,
            },
            {
              path: "/dashboard/attendance/:userId",
              element: <UserAttendancePage />,
            },
            {
              path: "/dashboard/users",
              element: <Userspage />,
            },
            {
              path: "/dashboard/users/:userId/profile",
              element: <UserProfilePage />,
            },
            {
              path: "/dashboard/users/create",
              element: <AddUserPage />,
            },
            {
              path: "/dashboard/add-facescan",
              element: <AddUserFaceScan />,
            },
            {
              path: "/dashboard/events/:eventId/attendance-in",
              element: <EventSignIn />,
            },
            {
              path: "/dashboard/events/:eventId/attendance-out",
              element: <EventSignOut />,
            },
            {
              path: "/dashboard/attendance/reports",
              element: <AttendanceReportsPage />,
            },
          ],
        },
      ],
    },
  ];

  const publicRoutes = [
    {
      path: "/",
      element: <LoginPage />,
      errorElement: <ErrorPage />,
    },

    {
      path: "/login",
      element: <LoginPage />,
    },

    {
      path: "/forgot-password",
      element: <ForgotPasswordPage />,
    },

    {
      path: "/reset-password",
      element: <ResetPasswordPage />,
    },
  ];

  const router = createBrowserRouter([...publicRoutes, ...protectedRoutes]);

  return <RouterProvider router={router} />;
};

export default Routes;

// src/components/navigation.js
// Single source of truth for the app's primary destinations. Consumed by
// AppNavbar (desktop top tabs) and BottomNav (mobile bottom tab bar) so the
// two shells can never drift apart.
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Users,
  UserCog,
} from "lucide-react";

/**
 * Primary destinations for the current user. At most 4 entries so that,
 * together with the "Menu" tab, the mobile bottom bar never exceeds 5 tabs.
 * `end: true` marks routes that must match exactly (the dashboard index,
 * which is a prefix of every other path). `shortTitle` is the compact label
 * used in the bottom bar where horizontal space is tight.
 */
export const getPrimaryNavItems = (user) => {
  const isAdmin = user?.role === "ADMIN";
  const base = [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
    { title: "Events", path: "/dashboard/events", icon: CalendarDays },
  ];
  if (isAdmin) {
    return [
      ...base,
      {
        title: "Reports",
        path: "/dashboard/attendance/reports",
        icon: BarChart3,
      },
      { title: "Review", path: "/dashboard/review", icon: ShieldCheck },
    ];
  }
  return [
    ...base,
    {
      title: "My Attendance",
      shortTitle: "Attendance",
      path: `/dashboard/attendance/${user?.id}`,
      icon: ClipboardCheck,
    },
  ];
};

/** Admin-only management destinations (desktop dropdown / mobile menu sheet). */
export const getManagementNavItems = (user) =>
  user?.role === "ADMIN"
    ? [
        { title: "Users", path: "/dashboard/users", icon: Users },
        { title: "Admins", path: "/dashboard/admins", icon: UserCog },
      ]
    : [];

/**
 * Route-active test shared by both shells. Non-exact items match their
 * subtree too (e.g. Events stays lit on an event's detail page).
 */
export const isNavItemActive = (pathname, item) =>
  item.end
    ? pathname === item.path
    : pathname === item.path || pathname.startsWith(`${item.path}/`);

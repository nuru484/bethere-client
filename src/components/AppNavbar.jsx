import React, { useState, useEffect } from "react";
import {
  CalendarCheck2,
  UserRoundPen,
  Home,
  Users,
  ScanFace,
  Menu,
  X,
  FileBarChart,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import UserProfileDropdown from "@/components/users/user-profile/UserProfileDropdown";
import logo from "/assets/logo.png";

const getMenuItems = (user) => {
  const isAdmin = user?.role === "ADMIN";
  const shouldShowFaceScan = user?.hasFaceScan === false;

  return [
    {
      title: "Dashboard",
      icon: Home,
      url: "",
      path: "/dashboard",
    },
    {
      title: "Events",
      icon: CalendarCheck2,
      url: "events",
      path: "/dashboard/events",
    },
    ...(!isAdmin
      ? [
          {
            title: "My Attendance",
            icon: UserRoundPen,
            url: `attendance/${user.id}`,
            path: `/dashboard/attendance/${user.id}`,
          },
        ]
      : []),
    ...(shouldShowFaceScan
      ? [
          {
            title: "Add Face Scan",
            icon: ScanFace,
            url: "add-facescan",
            path: "/dashboard/add-facescan",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Users",
            icon: Users,
            url: "users",
            path: "/dashboard/users",
          },
          {
            title: "Admins",
            icon: ShieldCheck,
            url: "admins",
            path: "/dashboard/admins",
          },
          {
            title: "Reports",
            icon: FileBarChart,
            url: "attendance/reports",
            path: "/dashboard/attendance/reports",
          },
        ]
      : []),
  ];
};

export function AppNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const items = React.useMemo(() => getMenuItems(user), [user]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check responsive layout
  useEffect(() => {
    const checkMobileView = () => {
      const estimatedWidth = items.length * 120 + 300;
      setIsMobileView(
        window.innerWidth < estimatedWidth || window.innerWidth < 1024
      );
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, [items.length]);

  const isActiveTab = (item) => location.pathname === item.path;

  const handleNavClick = () => setIsMenuOpen(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest("nav")) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <NavLink
            to="/dashboard"
            className="flex items-center space-x-3 group flex-shrink-0"
            onClick={handleNavClick}
          >
            <div className="relative">
              <img
                src={logo}
                alt="BeThere Logo"
                className="h-12 w-12 object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-emerald-600 font-bold text-xl tracking-tight whitespace-nowrap">
                BeThere
              </span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block whitespace-nowrap">
                Attendance Management
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          {!isMobileView && (
            <div className="flex items-center space-x-2">
              {items.map((item) => {
                const isActive = isActiveTab(item);
                return (
                  <NavLink
                    key={item.title}
                    to={
                      item.url === "" ? "/dashboard" : `/dashboard/${item.url}`
                    }
                    className="group"
                  >
                    <button
                      className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                      }`}
                    >
                      <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                      {isActive && (
                        <motion.span
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full"
                        />
                      )}
                    </button>
                  </NavLink>
                );
              })}

              {/* Desktop User Profile */}
              <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
                <UserProfileDropdown />
              </div>
            </div>
          )}

          {/* Mobile View - Profile and Menu Toggle */}
          {isMobileView && (
            <div className="flex items-center space-x-3">
              {/* Mobile User Profile */}
              <UserProfileDropdown />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-emerald-600 transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isMenuOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    {isMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileView && isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200 bg-gray-50"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {items.map((item, index) => {
                const isActive = isActiveTab(item);
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavLink
                      to={
                        item.url === ""
                          ? "/dashboard"
                          : `/dashboard/${item.url}`
                      }
                      onClick={handleNavClick}
                    >
                      <button
                        className={`w-full flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-gray-700 hover:bg-white hover:text-emerald-600"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default AppNavbar;

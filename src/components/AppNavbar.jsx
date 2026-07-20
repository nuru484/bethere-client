import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import UserProfileDropdown from "@/components/users/user-profile/UserProfileDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const getMenuItems = (user) => {
  const isAdmin = user?.role === "ADMIN";
  return [
    {
      title: "Dashboard",
      url: "",
      path: "/dashboard",
    },
    {
      title: "Events",
      url: "events",
      path: "/dashboard/events",
    },
    ...(!isAdmin
      ? [
          {
            title: "My Attendance",
            url: `attendance/${user.id}`,
            path: `/dashboard/attendance/${user.id}`,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Management",
            type: "menu",
            children: [
              {
                title: "Users",
                url: "users",
                path: "/dashboard/users",
              },
              {
                title: "Admins",
                url: "admins",
                path: "/dashboard/admins",
              },
            ],
          },
          {
            title: "Reports",
            url: "attendance/reports",
            path: "/dashboard/attendance/reports",
          },
          {
            title: "Review",
            url: "review",
            path: "/dashboard/review",
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
        window.innerWidth < estimatedWidth || window.innerWidth < 1024,
      );
    };
    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, [items.length]);
  const isActiveTab = (item) => location.pathname === item.path;
  const isMenuActive = (item) =>
    item.children?.some((child) => location.pathname === child.path);
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
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 group flex-shrink-0"
            onClick={handleNavClick}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-foreground font-mono text-sm font-bold text-background transition-transform duration-200 group-hover:scale-105">
              B/
            </span>
            <div className="flex flex-col">
              <span className="font-body text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
                BeThere
              </span>
              <span className="-mt-0.5 hidden font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground sm:block whitespace-nowrap">
                Attendance
              </span>
            </div>
          </NavLink>
          {/* Desktop Nav */}
          {!isMobileView && (
            <div className="flex items-center space-x-2">
              {items.map((item) => {
                if (item.type === "menu") {
                  const isActive = isMenuActive(item);
                  return (
                    <DropdownMenu key={item.title}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                            isActive
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          <span>{item.title}</span>
                          <ChevronDown className="h-4 w-4" />
                          {isActive && (
                            <motion.span
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                            />
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-40">
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child.title} asChild>
                            <NavLink
                              to={`/dashboard/${child.url}`}
                              className="cursor-pointer"
                            >
                              {child.title}
                            </NavLink>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

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
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      <span>{item.title}</span>
                      {isActive && (
                        <motion.span
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                        />
                      )}
                    </button>
                  </NavLink>
                );
              })}
              {/* Desktop User Profile */}
              <div className="flex items-center gap-1 ml-4 pl-4 border-l border-border">
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
                className="inline-flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
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
            className="overflow-hidden border-t border-border bg-card"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {items.map((item, index) => {
                if (item.type === "menu") {
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-1"
                    >
                      <p className="px-4 pt-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                        {item.title}
                      </p>
                      {item.children.map((child) => {
                        const isActive = isActiveTab(child);
                        return (
                          <NavLink
                            key={child.title}
                            to={`/dashboard/${child.url}`}
                            onClick={handleNavClick}
                          >
                            <button
                              className={`w-full flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                            >
                              <span>{child.title}</span>
                            </button>
                          </NavLink>
                        );
                      })}
                    </motion.div>
                  );
                }

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
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
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

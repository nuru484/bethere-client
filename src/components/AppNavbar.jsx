import React from "react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import UserProfileDropdown from "@/components/users/user-profile/UserProfileDropdown";
import {
  getPrimaryNavItems,
  getManagementNavItems,
  isNavItemActive,
} from "@/components/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabClass = (isActive) =>
  `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
    isActive
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
  }`;

/**
 * Top app bar. Navigation tabs and the account dropdown are desktop-only
 * (lg and up); below lg the bar carries just the logo and BottomNav owns
 * navigation. Breakpoints are pure CSS: a JS-measured breakpoint paints the
 * full desktop tab row on phones before the effect runs, which pushes the
 * document wider than the viewport.
 */
export function AppNavbar() {
  const { user } = useAuth();
  const location = useLocation();
  const items = React.useMemo(() => getPrimaryNavItems(user), [user]);
  const managementItems = React.useMemo(
    () => getManagementNavItems(user),
    [user],
  );
  const isManagementActive = managementItems.some((item) =>
    isNavItemActive(location.pathname, item),
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-3 h-16 lg:h-20">
          {/* Logo */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 group min-w-0"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground font-mono text-sm font-bold text-background transition-transform duration-200 group-hover:scale-105">
              B/
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-body text-lg font-semibold tracking-tight text-foreground">
                BeThere
              </span>
              <span className="-mt-0.5 hidden truncate font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground sm:block">
                Attendance
              </span>
            </div>
          </NavLink>

          {/* Desktop nav - never rendered below lg, so it can't overflow phones */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {items.map((item) => {
              const isActive = isNavItemActive(location.pathname, item);
              return (
                <NavLink key={item.title} to={item.path} className={tabClass(isActive)}>
                  <span>{item.title}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                    />
                  )}
                </NavLink>
              );
            })}
            {managementItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`gap-1 ${tabClass(isManagementActive)}`}>
                    <span>Management</span>
                    <ChevronDown className="h-4 w-4" />
                    {isManagementActive && (
                      <motion.span
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                      />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-40">
                  {managementItems.map((child) => (
                    <DropdownMenuItem key={child.title} asChild>
                      <NavLink to={child.path} className="cursor-pointer">
                        {child.title}
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="flex items-center gap-1 ml-4 pl-4 border-l border-border">
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
export default AppNavbar;

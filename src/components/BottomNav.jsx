// src/components/BottomNav.jsx
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Home, Moon, Power, ScanFace, Sun, User } from "lucide-react";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { getPrimaryNavItems, getManagementNavItems, isNavItemActive } from "@/components/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const menuRowClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/**
 * Mobile-only (below lg) bottom tab bar, Facebook-style: the primary
 * destinations as icon tabs plus a trailing "Menu" tab (the user's avatar)
 * that opens a bottom sheet with the remaining account and management
 * actions. Together with the desktop-only tabs in AppNavbar it carries all
 * navigation below lg.
 */
const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const items = getPrimaryNavItems(user);
  const managementItems = getManagementNavItems(user);
  const userInitials = `${user.firstName?.charAt(0) || ""}${
    user.lastName?.charAt(0) || ""
  }`;
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const showFaceScan = user.role !== "ADMIN" && user.hasFaceScan === false;

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto flex max-w-7xl items-stretch">
          {items.map((item) => {
            const isActive = isNavItemActive(location.pathname, item);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.title}
                to={item.path}
                aria-label={item.title}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-2 pt-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground active:text-foreground"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-none">
                  {item.shortTitle || item.title}
                </span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-2 pt-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring ${
              menuOpen ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Avatar
              className={`h-5 w-5 border ${
                menuOpen ? "border-foreground" : "border-border"
              }`}
            >
              <AvatarImage src={user.profilePicture ?? undefined} alt="" />
              <AvatarFallback className="bg-foreground text-[8px] font-semibold text-background">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="w-full truncate px-0.5 text-center text-[10px] font-medium leading-none">
              Menu
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="border-b border-border p-4 pr-12 text-left">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border">
                <AvatarImage
                  src={user.profilePicture ?? undefined}
                  alt={`${fullName} profile`}
                />
                <AvatarFallback className="bg-foreground text-lg font-semibold text-background">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <SheetTitle className="truncate text-sm font-medium leading-none">
                  {fullName}
                </SheetTitle>
                <SheetDescription className="truncate text-xs">
                  {user.email}
                </SheetDescription>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          <div className="p-2">
            {managementItems.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                  Management
                </p>
                {managementItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => goTo(item.path)}
                      className={menuRowClass}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </>
            )}

            <p className="px-3 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Account
            </p>
            <button
              type="button"
              onClick={() => goTo(`/dashboard/users/${user.id}/profile`)}
              className={menuRowClass}
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Profile</span>
            </button>
            {/* Face enrollment - attendants only, and only until they enroll
                (mirrors the desktop dropdown's rule). */}
            {showFaceScan && (
              <button
                type="button"
                onClick={() => goTo("/dashboard/add-facescan")}
                className={menuRowClass}
              >
                <ScanFace className="h-4 w-4 shrink-0" />
                <span>Add Face Scan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo("/")}
              className={menuRowClass}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </button>
            {/* Theme flip keeps the sheet open so the change is visible. */}
            <button type="button" onClick={toggleTheme} className={menuRowClass}>
              {isDark ? (
                <Sun className="h-4 w-4 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 shrink-0" />
              )}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>

            <div className="my-2 h-px bg-border" />

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
              className={`${menuRowClass} text-destructive hover:bg-destructive/10 active:bg-destructive/10`}
            >
              <Power className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirm Logout"
        description="Are you sure you want to sign out of your account?"
        confirmText="Logout"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />
    </>
  );
};

export default BottomNav;

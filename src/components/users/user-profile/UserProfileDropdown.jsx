// src/components/users/user-profile/UserProfileDropdown.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Power, Home, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useLogout } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";

const UserProfileDropdown = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = useLogout();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const userInitials = `${user.firstName?.charAt(0) || ""}${
    user.lastName?.charAt(0) || ""
  }`;
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  const handleNavigation = (href) => {
    navigate(href);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity border-2 border-foreground">
            <AvatarImage
              src={user.profilePicture ?? undefined}
              alt={fullName}
            />
            <AvatarFallback className="bg-foreground text-background font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="p-0 my-2 bg-popover border-border"
          align="end"
          forceMount
        >
          {/* Profile Header */}
          <div className="p-4 bg-card">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-border">
                <AvatarImage
                  src={user.profilePicture ?? undefined}
                  alt={`${fullName} Profile`}
                />
                <AvatarFallback className="bg-foreground text-background text-lg font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">
                  {fullName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuLabel className="text-xs text-muted-foreground px-4 py-2">
            Account
          </DropdownMenuLabel>

          {/* Profile Link */}
          <DropdownMenuItem
            onClick={() =>
              handleNavigation(`/dashboard/users/${user.id}/profile`)
            }
            className="cursor-pointer px-4 py-2 hover:bg-accent focus:bg-accent text-foreground flex items-center"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          {/* Home Link */}
          <DropdownMenuItem
            onClick={() => handleNavigation("/")}
            className="cursor-pointer px-4 py-2 hover:bg-accent focus:bg-accent text-foreground flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </DropdownMenuItem>

          {/* Theme Toggle - keep the menu open so the flip is visible */}
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              toggleTheme();
            }}
            className="cursor-pointer px-4 py-2 hover:bg-accent focus:bg-accent text-foreground flex items-center"
          >
            {isDark ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>{isDark ? "Light mode" : "Dark mode"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogoutClick}
            className="cursor-pointer px-4 py-2 hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
          >
            <Power className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirm Logout"
        description="Are you sure you want to sign out of your account?"
        confirmText="Logout"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default UserProfileDropdown;

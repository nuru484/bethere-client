import { SidebarProvider } from "@/components/ui/sidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <SidebarProvider>
      <main className="min-h-screen w-full bg-background">
        <AppNavbar />
        {/* Content shell mirrors the navbar's inner width so both align. */}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}

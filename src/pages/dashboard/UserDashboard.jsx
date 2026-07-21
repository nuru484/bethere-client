// src/pages/dashboard/UserDashboard.jsx
//
// The redesigned attendant (USER) dashboard: a personal, actionable view.
// A now/next hero (with a check-in / check-out CTA) leads, then personal KPIs
// with a streak, the attendance calendar, the personal trend, and per-status /
// per-event breakdowns. Everything is scoped to the signed-in user.
import { useState } from "react";
import { format, startOfYear } from "date-fns";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import NowNextHero from "@/components/dashboard/analytics/user/NowNextHero";
import UserHeroKpis from "@/components/dashboard/analytics/user/UserHeroKpis";
import AttendanceCalendar from "@/components/dashboard/analytics/user/AttendanceCalendar";
import UserAttendanceTrend from "@/components/dashboard/analytics/user/UserAttendanceTrend";
import {
  UserStatusDonut,
  UserEventBreakdown,
} from "@/components/dashboard/analytics/user/UserBreakdownCards";

const UserDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  return (
    <div className="w-full min-h-screen">
      <div className="space-y-6">
        {/* header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              My dashboard
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Your attendance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-1.5 sm:text-base">
              What&apos;s next, how you&apos;re doing, and how consistent you&apos;ve been
            </p>
          </div>
          <DateRangeSelector onDateChange={setDateRange} />
        </div>

        {/* now / next - the action surface */}
        <NowNextHero />

        {/* personal KPIs */}
        <UserHeroKpis dateRange={dateRange} />

        {/* consistency calendar (its own fixed window) */}
        <AttendanceCalendar />

        {/* personal trend */}
        <UserAttendanceTrend dateRange={dateRange} />

        {/* breakdowns */}
        <div className="grid gap-4 lg:grid-cols-2">
          <UserStatusDonut dateRange={dateRange} />
          <UserEventBreakdown dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

// src/pages/dashboard/AdminDashboard.jsx
//
// The redesigned admin analytics dashboard. Four stories - presence,
// punctuality, integrity, engagement - each a set of independently-loading
// slice widgets, above a live operational strip and a hero KPI row. The date
// range drives every range-based widget; the live strip and retention curve
// stand outside it.
import { useState } from "react";
import PropTypes from "prop-types";
import { format, subDays } from "date-fns";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import LiveStrip from "@/components/dashboard/analytics/LiveStrip";
import HeroKpis from "@/components/dashboard/analytics/HeroKpis";
import PresenceTrendChart from "@/components/dashboard/analytics/PresenceTrendChart";
import PresenceBreakdownCard from "@/components/dashboard/analytics/PresenceBreakdownCard";
import PunctualityTrendChart from "@/components/dashboard/analytics/PunctualityTrendChart";
import LatenessHistogram from "@/components/dashboard/analytics/LatenessHistogram";
import ArrivalHeatmap from "@/components/dashboard/analytics/ArrivalHeatmap";
import IntegrityScoreCard from "@/components/dashboard/analytics/IntegrityScoreCard";
import AnomalyTrendChart from "@/components/dashboard/analytics/AnomalyTrendChart";
import AnomalyBreakdownCard from "@/components/dashboard/analytics/AnomalyBreakdownCard";
import LivenessQualityCard from "@/components/dashboard/analytics/LivenessQualityCard";
import TopAttendeesCard from "@/components/dashboard/analytics/TopAttendeesCard";
import RetentionCurveCard from "@/components/dashboard/analytics/RetentionCurveCard";
import AiSummaryCard from "@/components/dashboard/analytics/AiSummaryCard";

const SectionHeading = ({ title, hint }) => (
  <div className="flex items-baseline justify-between gap-3 pt-2">
    <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-foreground sm:text-xl">
      {title}
    </h2>
    {hint && <p className="hidden text-xs text-muted-foreground sm:block">{hint}</p>}
  </div>
);

SectionHeading.propTypes = {
  title: PropTypes.string,
  hint: PropTypes.string,
};

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  return (
    <div className="w-full min-h-screen">
      <div className="space-y-8">
        {/* header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              Overview
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:mt-1.5 sm:text-base">
              Presence, punctuality, and verified-attendance integrity at a glance
            </p>
          </div>
          <DateRangeSelector onDateChange={setDateRange} />
        </div>

        {/* live operational strip */}
        <LiveStrip />

        {/* hero KPIs */}
        <HeroKpis dateRange={dateRange} />

        {/* AI narrative */}
        <AiSummaryCard dateRange={dateRange} />

        {/* PRESENCE */}
        <section className="space-y-4">
          <SectionHeading title="Presence" hint="Who showed up" />
          <PresenceTrendChart dateRange={dateRange} />
          <div className="grid gap-4 lg:grid-cols-2">
            <PresenceBreakdownCard dateRange={dateRange} by="status" title="Status breakdown" subtitle="Present · late · absent" />
            <PresenceBreakdownCard dateRange={dateRange} by="eventType" title="Event type" subtitle="Recurring vs one-off" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PresenceBreakdownCard dateRange={dateRange} by="event" title="Top events" subtitle="By attendance volume" variant="bars" />
            <PresenceBreakdownCard dateRange={dateRange} by="location" title="Top venues" subtitle="By attendance volume" variant="bars" />
          </div>
        </section>

        {/* PUNCTUALITY */}
        <section className="space-y-4">
          <SectionHeading title="Punctuality" hint="When they arrive" />
          <div className="grid gap-4 lg:grid-cols-2">
            <PunctualityTrendChart dateRange={dateRange} />
            <LatenessHistogram dateRange={dateRange} />
          </div>
          <ArrivalHeatmap dateRange={dateRange} />
        </section>

        {/* INTEGRITY */}
        <section className="space-y-4">
          <SectionHeading title="Integrity" hint="Was it real" />
          <div className="grid gap-4 lg:grid-cols-2">
            <IntegrityScoreCard dateRange={dateRange} />
            <AnomalyTrendChart dateRange={dateRange} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnomalyBreakdownCard dateRange={dateRange} by="type" title="Anomalies by type" />
            <AnomalyBreakdownCard dateRange={dateRange} by="severity" title="Anomalies by severity" />
            <LivenessQualityCard dateRange={dateRange} />
          </div>
        </section>

        {/* ENGAGEMENT */}
        <section className="space-y-4">
          <SectionHeading title="Engagement" hint="Who keeps coming back" />
          <div className="grid gap-4 lg:grid-cols-2">
            <TopAttendeesCard dateRange={dateRange} />
            <RetentionCurveCard />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;

// src/components/dashboard/user/UserAttendanceSummaryCards.jsx
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UserAttendanceSummaryCards = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    {
      title: "Total Attendances",
      value: summary.totalAttendances,
    },
    {
      title: "Present",
      value: summary.statusBreakdown.present,
      valueColor: "text-[#1a7f53] dark:text-[#3ecf8e]",
    },
    {
      title: "Late",
      value: summary.statusBreakdown.late,
    },
    {
      title: "Absent",
      value: summary.statusBreakdown.absent,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        return (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`font-display text-3xl font-semibold ${
                  card.valueColor || "text-foreground"
                }`}
              >
                {card.value}
              </div>
              {card.title === "Total Attendances" && (
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.dateRange.from} to {summary.dateRange.to}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

UserAttendanceSummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalAttendances: PropTypes.number,
    dateRange: PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string,
    }),
    statusBreakdown: PropTypes.shape({
      present: PropTypes.number,
      late: PropTypes.number,
      absent: PropTypes.number,
    }),
  }),
};

export default UserAttendanceSummaryCards;

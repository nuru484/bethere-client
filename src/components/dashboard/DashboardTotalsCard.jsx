// src/components/DashboardTotalsCard.jsx
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LABELS = {
  totalUsers: "Total Users",
  totalEvents: "Total Events",
  totalRecurringEvents: "Recurring Events",
  totalNonRecurringEvents: "Non-Recurring Events",
  totalActiveSessions: "Active Sessions",
  totalInactiveSessions: "Inactive Sessions",
};

const DashboardTotalsCard = ({ totals, isAdmin = false }) => {
  const displayOrder = isAdmin
    ? [
        "totalUsers",
        "totalEvents",
        "totalRecurringEvents",
        "totalNonRecurringEvents",
      ]
    : [
        "totalRecurringEvents",
        "totalNonRecurringEvents",
        "totalActiveSessions",
        "totalInactiveSessions",
      ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayOrder.map((key) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              {LABELS[key] || key}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-semibold text-foreground">
              {totals[key] !== undefined ? totals[key] : 0}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// PropTypes validation
DashboardTotalsCard.propTypes = {
  totals: PropTypes.shape({
    totalUsers: PropTypes.number,
    totalEvents: PropTypes.number,
    totalRecurringEvents: PropTypes.number,
    totalNonRecurringEvents: PropTypes.number,
    totalActiveSessions: PropTypes.number,
    totalInactiveSessions: PropTypes.number,
  }).isRequired, // totals must be passed in

  isAdmin: PropTypes.bool,
};

export default DashboardTotalsCard;

// src/components/dashboard/DashboardTotalsCardError.jsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ErrorMessage from "@/components/ui/ErrorMessage";
import PropTypes from "prop-types";

const DashboardTotalsCardError = ({ error, onRetry }) => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <h3 className="text-lg font-semibold text-foreground">
          Dashboard Statistics
        </h3>
      </CardHeader>
      <CardContent>
        <ErrorMessage variant="card" error={error} onRetry={onRetry} />
      </CardContent>
    </Card>
  );
};

DashboardTotalsCardError.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default DashboardTotalsCardError;

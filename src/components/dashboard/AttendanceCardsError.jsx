// src/components/dashboard/AttendanceCardsError.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CardErrorState from "./CardErrorState";
import PropTypes from "prop-types";

const AttendanceCardsError = ({ error, onRetry }) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {["Total Attendances", "Unique Users", "Present Rate", "Absent Rate"].map(
        (title) => (
          <Card key={title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardErrorState message={error} onRetry={onRetry} />
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

AttendanceCardsError.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default AttendanceCardsError;
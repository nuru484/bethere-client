// src/api/query-keys.js
//
// Single source of truth for every React Query key in the app. Hooks build
// their keys from here so mutations can invalidate by prefix without having
// to know (or repeat) the exact key layout of each list. The `*All` entries
// are the invalidation prefixes: invalidating ["userAttendance"] catches
// every ["userAttendance", userId, params] variant.

// Route params arrive as strings while mutation variables are often numbers;
// normalizing ids keeps ["event", "7"] and ["event", 7] from becoming two
// unrelated cache entries (and from silently breaking prefix invalidation).
const id = (value) =>
  value === undefined || value === null ? value : String(value);

export const queryKeys = {
  users: {
    all: ["users"],
    list: (params = {}) => ["users", params],
    search: (params = {}) => ["users", "search", params],
    detail: (userId) => ["user", id(userId)],
  },
  admins: {
    all: ["admins"],
    list: (params = {}) => ["admins", params],
    detail: (adminId) => ["admin", id(adminId)],
  },
  events: {
    all: ["events"],
    list: (params = {}) => ["events", params],
    detail: (eventId) => ["event", id(eventId)],
    venueCodes: (eventId) => ["venueCodes", id(eventId)],
  },
  attendance: {
    usersAll: ["userAttendance"],
    user: (userId, params = {}) => ["userAttendance", id(userId), params],
    eventAll: (eventId) => ["eventAttendance", id(eventId)],
    event: (eventId, params = {}) => ["eventAttendance", id(eventId), params],
    userEventsAll: ["userEventAttendance"],
    userEvent: (userId, eventId, params = {}) => [
      "userEventAttendance",
      id(userId),
      id(eventId),
      params,
    ],
    reportAll: ["attendanceReport"],
    report: (params = {}) => ["attendanceReport", params],
  },
  dashboard: {
    adminTotals: ["adminDashboardTotals"],
    // Distinct root from userAttendanceData* below: ["usersAttendanceData"] is
    // NOT a prefix of ["allUsersAttendanceData", params], so the admin-wide
    // chart needs its own invalidation prefix.
    allUsersAttendanceDataAll: ["allUsersAttendanceData"],
    allUsersAttendanceData: (params = {}) => ["allUsersAttendanceData", params],
    userTotals: ["userDashboardTotals"],
    recentEvents: ["recentEvents"],
    userAttendanceDataAll: ["usersAttendanceData"],
    userAttendanceData: (params = {}) => ["usersAttendanceData", params],
  },
  // The redesigned admin analytics slices. Each widget owns its key so the
  // date-range change refetches every slice while they stay independently
  // cached; `all` is the shared invalidation prefix.
  analytics: {
    all: ["adminAnalytics"],
    live: ["adminAnalytics", "live"],
    kpis: (params = {}) => ["adminAnalytics", "kpis", params],
    presenceTrend: (params = {}) => ["adminAnalytics", "presenceTrend", params],
    presenceBreakdown: (params = {}) => ["adminAnalytics", "presenceBreakdown", params],
    punctualityTrend: (params = {}) => ["adminAnalytics", "punctualityTrend", params],
    latenessDistribution: (params = {}) => ["adminAnalytics", "latenessDistribution", params],
    arrivalHeatmap: (params = {}) => ["adminAnalytics", "arrivalHeatmap", params],
    anomalyTrend: (params = {}) => ["adminAnalytics", "anomalyTrend", params],
    anomalyBreakdown: (params = {}) => ["adminAnalytics", "anomalyBreakdown", params],
    livenessQuality: (params = {}) => ["adminAnalytics", "livenessQuality", params],
    integritySummary: (params = {}) => ["adminAnalytics", "integritySummary", params],
    topAttendees: (params = {}) => ["adminAnalytics", "topAttendees", params],
    retentionCurve: (params = {}) => ["adminAnalytics", "retentionCurve", params],
  },
  // The attendant's personal analytics slices (scoped to the signed-in user).
  userAnalytics: {
    all: ["userAnalytics"],
    nowNext: ["userAnalytics", "nowNext"],
    kpis: (params = {}) => ["userAnalytics", "kpis", params],
    trend: (params = {}) => ["userAnalytics", "trend", params],
    statusBreakdown: (params = {}) => ["userAnalytics", "statusBreakdown", params],
    eventBreakdown: (params = {}) => ["userAnalytics", "eventBreakdown", params],
    calendar: (params = {}) => ["userAnalytics", "calendar", params],
  },
  review: {
    anomaliesAll: ["anomalies"],
    anomalies: (params = {}) => ["anomalies", params],
    auditLogsAll: ["auditLogs"],
    auditLogs: (params = {}) => ["auditLogs", params],
  },
  faceScan: {
    detail: (userId) => ["facescan", id(userId)],
  },
  passwordReset: {
    verifyToken: (token) => ["verify-reset-token", token],
  },
};

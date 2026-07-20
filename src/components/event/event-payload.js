// src/components/event/event-payload.js
//
// Form values -> API payload transform shared by the create and update
// event pages (they had drifted into verbatim copies of this block).
export const buildEventPayload = (data) => ({
  ...data,
  startDate: new Date(data.startDate).toISOString(),
  endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
  ...(data.isRecurring &&
    data.recurrenceInterval && {
      recurrenceInterval: data.recurrenceInterval,
    }),
  ...(data.durationDays && { durationDays: data.durationDays }),
});

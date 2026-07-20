// src/pages/dashboard/events/VenueCodePage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useVenueCodes } from "@/hooks/useAttendance";
import { useGetEvent } from "@/hooks/useEvent";
import { Button } from "@/components/ui/button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import { Maximize, Minimize, ArrowLeft } from "lucide-react";

const DEFAULT_PERIOD_MS = 30000;

// Refetch a fresh batch once this few codes (active + upcoming) remain, so the
// display never runs dry mid-rotation.
const REFETCH_THRESHOLD = 4;

export default function VenueCodePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const { data: eventData } = useGetEvent(eventId);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useVenueCodes(eventId);

  const [now, setNow] = useState(() => Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tick a shared clock so the active code and countdown advance together.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const event = eventData?.data;
  const payload = data?.data;
  const periodMs = payload?.periodMs || DEFAULT_PERIOD_MS;
  const codes = useMemo(() => payload?.codes || [], [payload]);

  const { activeCode, secondsLeft, remaining } = useMemo(() => {
    let active = null;
    let count = 0;
    for (const c of codes) {
      const from = new Date(c.validFrom).getTime();
      const to = new Date(c.validTo).getTime();
      if (to > now) count += 1;
      if (now >= from && now < to) active = c;
    }
    const left = active
      ? Math.max(0, Math.ceil((new Date(active.validTo).getTime() - now) / 1000))
      : 0;
    return { activeCode: active, secondsLeft: left, remaining: count };
  }, [codes, now]);

  // Pull a new batch before the current one runs out. Guard with a ref so we
  // fire once per batch rather than on every tick. The guard is keyed on the
  // batch's first code, not on `data`: a refetch that returns the same batch
  // still yields a new `data` object, which would re-arm the guard and spin
  // this into an unbounded request loop.
  const firstCode = codes[0]?.code;
  const refetchedRef = useRef(false);
  useEffect(() => {
    refetchedRef.current = false;
  }, [firstCode]);
  useEffect(() => {
    if (!isFetching && remaining <= REFETCH_THRESHOLD && !refetchedRef.current) {
      refetchedRef.current = true;
      refetch();
    }
  }, [remaining, isFetching, refetch]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      rootRef.current?.requestFullscreen?.();
    }
  }, []);

  const qrValue = activeCode
    ? `BETHERE1:${eventId}:${activeCode.code}`
    : null;

  const totalSeconds = Math.round(periodMs / 1000);
  const progressPct = totalSeconds
    ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
    : 0;

  if (isError) {
    const message = extractApiErrorMessage(error).message;
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <ErrorMessage error={message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 text-foreground"
    >
      {/* Top bar: back + fullscreen (hidden feel on a projector but reachable) */}
      <div className="flex w-full max-w-3xl items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/events/${eventId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={2} />
          Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="mr-2 h-4 w-4" strokeWidth={2} />
          ) : (
            <Maximize className="mr-2 h-4 w-4" strokeWidth={2} />
          )}
          {isFullscreen ? "Exit" : "Full screen"}
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground sm:text-sm">
            Scan to mark attendance
          </p>
          <h1 className="mt-2 break-words px-2 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {event?.title || "Venue Code"}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-foreground border-t-transparent"
              role="status"
              aria-label="Loading venue code"
            />
          </div>
        ) : qrValue ? (
          <div className="rounded-3xl bg-white p-5 sm:p-8">
            <QRCodeSVG
              value={qrValue}
              // Big and high-contrast so it reads from across a room.
              className="h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96"
              level="M"
              marginSize={2}
            />
          </div>
        ) : (
          <div className="flex h-64 w-64 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border sm:h-80 sm:w-80">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-foreground border-t-transparent"
              role="status"
              aria-label="Loading next code"
            />
            <p className="text-sm text-muted-foreground">Loading next code...</p>
          </div>
        )}

        {/* Countdown to the next rotation */}
        {qrValue && (
          <div className="w-full max-w-xs">
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-mono text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
                {secondsLeft}
              </span>
              <span className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">
                sec
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Code rotates automatically. Keep this screen visible at the venue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

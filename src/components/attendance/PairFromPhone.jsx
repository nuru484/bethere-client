// src/components/attendance/PairFromPhone.jsx
//
// The laptop side of the "scan from phone" hand-off. Starts a pairing, renders a
// QR the phone scans to open the capture on the phone, and polls until the phone
// finishes - then hands control back to the parent via onComplete.
import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, RefreshCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStartPairing, usePairingStatus } from "@/hooks/usePairing";
import { extractApiErrorMessage } from "@/utils/extract-api-error-message";
import toast from "react-hot-toast";

export default function PairFromPhone({
  scope,
  eventId,
  mode = "in",
  onComplete,
}) {
  const [pairing, setPairing] = useState(null); // { pairingId, handoffToken }
  const [error, setError] = useState("");
  const { mutate: start, isPending } = useStartPairing();

  const { data: statusData } = usePairingStatus(pairing?.pairingId, {
    enabled: Boolean(pairing),
  });
  const status = statusData?.data?.status;

  const begin = useCallback(() => {
    setError("");
    start(
      { scope, eventId, mode },
      {
        onSuccess: (response) => {
          const data = response?.data || {};
          setPairing({
            pairingId: data.pairingId,
            handoffToken: data.handoffToken,
          });
        },
        onError: (err) => {
          const { message } = extractApiErrorMessage(err);
          const msg = message || "Could not start the phone hand-off.";
          setError(msg);
          toast.error(msg);
        },
      }
    );
  }, [start, scope, eventId, mode]);

  // Completed on the phone: notify the parent once.
  useEffect(() => {
    if (status === "COMPLETED") onComplete?.();
  }, [status, onComplete]);

  const linkUrl = pairing
    ? `${window.location.origin}/pair?token=${encodeURIComponent(pairing.handoffToken)}`
    : "";

  if (!pairing) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
            <span>No camera here, or prefer your phone? Continue on your phone.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={begin}
            disabled={isPending}
            className="flex-shrink-0"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Smartphone className="mr-1.5 h-4 w-4" />
            )}
            Scan from phone
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <Check className="mx-auto mb-2 h-6 w-6 text-emerald-600" strokeWidth={2} />
        <p className="font-medium text-emerald-700 dark:text-emerald-400">
          Done on your phone.
        </p>
      </div>
    );
  }

  const expired = status === "EXPIRED";

  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      {expired ? (
        <>
          <p className="text-sm text-muted-foreground">
            This link expired. Generate a fresh one to try again.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={begin}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            New code
          </Button>
        </>
      ) : (
        <>
          <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            Continue on your phone
          </p>
          <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-3">
            <QRCodeSVG value={linkUrl} size={180} marginSize={0} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Scan this with your phone camera, then follow the steps there.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Waiting for your phone...
          </div>
        </>
      )}
    </div>
  );
}

PairFromPhone.propTypes = {
  scope: PropTypes.oneOf(["ATTENDANCE", "ENROLL"]).isRequired,
  eventId: PropTypes.number,
  mode: PropTypes.oneOf(["in", "out"]),
  onComplete: PropTypes.func,
};

// src/components/FaceScanner/FaceScannerSkeleton.jsx
import { Skeleton } from "@/components/ui/skeleton";

export default function FaceScannerSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <div
        className="bg-[#2b2b2b] p-6 rounded-2xl"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(250,250,250,0.10) 1px, transparent 1px)",
          backgroundSize: "7px 7px",
        }}
      >
        {/* Video container skeleton */}
        <div className="relative bg-black rounded-xl overflow-hidden mb-6">
          <div className="w-full h-80 relative">
            {/* Face detection overlay skeleton */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-80">
                {/* Corner brackets - dimmed */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-[#fafafa]/30 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-[#fafafa]/30 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-[#fafafa]/30 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#fafafa]/30 rounded-br-lg"></div>

                {/* Status indicator dot skeleton */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>

            {/* Corner decorations skeleton */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#fafafa]/20"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#fafafa]/20"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#fafafa]/20"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#fafafa]/20"></div>

            {/* Loading indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fafafa] mx-auto mb-3"></div>
                <p className="text-white font-mono text-xs font-bold uppercase tracking-tight">
                  Initializing camera...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action button skeleton */}
        <Skeleton className="w-full h-12 rounded-full" />
      </div>

      {/* Status indicator skeleton */}
      <div className="text-center font-medium p-4 mt-4 border border-border bg-card rounded-xl">
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>

      {/* Instructions skeleton */}
      <div className="mt-4 p-4 bg-card border border-border rounded-xl">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

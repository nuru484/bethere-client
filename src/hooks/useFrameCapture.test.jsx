// src/hooks/useFrameCapture.test.jsx
//
// Exercises the webcam burst-capture hook with getUserMedia and the canvas
// pipeline faked: a full burst hands the blobs to onComplete and releases
// the camera, unmount always stops the tracks, and a stream that resolves
// AFTER unmount (the getUserMedia race) is stopped instead of leaking.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFrameCapture } from "@/hooks/useFrameCapture";

const makeTrack = () => ({ stop: vi.fn() });
const makeStream = (tracks) => ({ getTracks: () => tracks });

// Minimal <video> stand-in: videoWidth flags "ready", currentTime advances on
// every read so the frozen-frame detector stays quiet.
const makeFakeVideo = () => {
  let time = 0;
  return {
    videoWidth: 640,
    videoHeight: 480,
    srcObject: null,
    onloadedmetadata: null,
    get currentTime() {
      time += 0.1;
      return time;
    },
  };
};

const realCreateElement = document.createElement.bind(document);

describe("useFrameCapture", () => {
  beforeEach(() => {
    // jsdom has no 2d canvas; fake just the capture pipeline.
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (cb) => cb(new Blob(["frame"], { type: "image/jpeg" })),
        };
      }
      return realCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete navigator.mediaDevices;
  });

  const mountWithCamera = async (options = {}) => {
    const tracks = [makeTrack()];
    const stream = makeStream(tracks);
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(stream),
    };

    const video = makeFakeVideo();
    const view = renderHook(() => useFrameCapture(options));

    // Attach the fake video element and let the camera effect run.
    view.result.current.videoRef.current = video;
    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    );
    await waitFor(() => expect(video.srcObject).toBe(stream));

    // The hook flips cameraReady in onloadedmetadata.
    act(() => video.onloadedmetadata());
    expect(view.result.current.cameraReady).toBe(true);

    return { view, tracks, video };
  };

  it("captures the requested burst, returns the blobs and releases the camera", async () => {
    const onComplete = vi.fn();
    const { view, tracks } = await mountWithCamera({
      frameCount: 3,
      intervalMs: 5,
      onComplete,
    });

    act(() => view.result.current.startCapture());
    expect(view.result.current.isCapturing).toBe(true);

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const blobs = onComplete.mock.calls[0][0];
    expect(blobs).toHaveLength(3);
    blobs.forEach((blob) => expect(blob).toBeInstanceOf(Blob));

    // The camera is released as soon as the burst is in hand - the upload
    // and server-side match can run for minutes.
    expect(tracks[0].stop).toHaveBeenCalled();
    expect(view.result.current.cameraReleased).toBe(true);
    expect(view.result.current.capturedCount).toBe(3);
  });

  it("stops the tracks on unmount", async () => {
    const { view, tracks } = await mountWithCamera();

    expect(tracks[0].stop).not.toHaveBeenCalled();
    view.unmount();
    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
  });

  it("stops an orphaned stream when unmounted during getUserMedia", async () => {
    const tracks = [makeTrack()];
    const stream = makeStream(tracks);

    // Deferred getUserMedia: the permission prompt is still "up" while the
    // hook unmounts.
    let resolveStream;
    navigator.mediaDevices = {
      getUserMedia: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveStream = resolve;
          })
      ),
    };

    const view = renderHook(() => useFrameCapture());
    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    );

    view.unmount();
    expect(tracks[0].stop).not.toHaveBeenCalled();

    // The stream arrives with nobody left to stop it - the hook must.
    await act(async () => {
      resolveStream(stream);
    });
    await waitFor(() => expect(tracks[0].stop).toHaveBeenCalledTimes(1));
  });

  it("surfaces a friendly message when camera access is denied", async () => {
    const denied = Object.assign(new Error("denied"), {
      name: "NotAllowedError",
    });
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockRejectedValue(denied),
    };

    const view = renderHook(() => useFrameCapture());

    await waitFor(() =>
      expect(view.result.current.cameraError).toMatch(
        /camera access was denied/i
      )
    );
  });
});

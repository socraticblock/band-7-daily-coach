// ============================================================================
// AUDIO + RECORDING FALLBACKS
// Browser quirks across iOS Safari, Chrome Android, desktop.
// The product must still work when MediaRecorder is unavailable.
// ============================================================================

export type AudioPlaybackCapabilities = {
  canAutoplay: boolean;
  hasMediaSource: boolean;
  recommendedAction: "play" | "tap_to_play" | "download_required";
};

export function detectAudioCapabilities(): AudioPlaybackCapabilities {
  if (typeof window === "undefined") {
    return { canAutoplay: false, hasMediaSource: false, recommendedAction: "tap_to_play" };
  }
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const hasMediaSource = "MediaSource" in window;
  return {
    canAutoplay: !isIOS,
    hasMediaSource,
    recommendedAction: isIOS ? "tap_to_play" : "play",
  };
}

export type RecordingCapabilities = {
  supported: boolean;
  reason?: string;
  fallback: "browser" | "upload" | "typed_notes";
};

export async function detectRecordingCapabilities(): Promise<RecordingCapabilities> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      supported: false,
      reason: "This browser does not support audio recording.",
      fallback: "upload",
    };
  }
  try {
    // Quick permission probe — do not actually record
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { supported: true, fallback: "browser" };
  } catch (err) {
    return {
      supported: false,
      reason: (err as Error).message || "Microphone permission denied.",
      fallback: "upload",
    };
  }
}

// ----------------------------------------------------------------------------
// Recording helper — uses MediaRecorder with a graceful fallback
// ----------------------------------------------------------------------------

export type RecordedBlob = {
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
};

export async function recordOnce(
  maxSeconds: number,
  onTick?: (elapsed: number) => void,
): Promise<RecordedBlob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  let start = Date.now();

  return new Promise<RecordedBlob>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const duration = (Date.now() - start) / 1000;
      stream.getTracks().forEach((t) => t.stop());
      resolve({ blob, durationSeconds: duration, mimeType });
    };
    recorder.onerror = (e) => {
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error(`Recording error: ${(e as ErrorEvent).message ?? "unknown"}`));
    };

    recorder.start();
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      onTick?.(elapsed);
      if (elapsed >= maxSeconds) {
        window.clearInterval(interval);
        recorder.stop();
      }
    }, 250);
  });
}

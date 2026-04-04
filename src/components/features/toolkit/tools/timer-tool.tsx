"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Mode = "stopwatch" | "timer";
type TimerStatus = "idle" | "running" | "paused";

const PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "5m", seconds: 300 },
  { label: "10m", seconds: 600 },
];

// ─── Circular Progress Ring ─────────────────────────────────────────────────

function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 8,
}: {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#842AEB"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-200 ease-linear"
      />
    </svg>
  );
}

// ─── Tick Ring (clock-face style) ───────────────────────────────────────────

function TickRing({ size = 240, seconds }: { size?: number; seconds: number }) {
  const center = size / 2;
  const outerRadius = (size - 16) / 2;
  const ticks = 60;

  // Current second position for the indicator dot
  const currentSecond = seconds % 60;
  const dotAngle = (currentSecond / 60) * 360 - 90;
  const dotRad = (dotAngle * Math.PI) / 180;
  const dotX = center + (outerRadius + 2) * Math.cos(dotRad);
  const dotY = center + (outerRadius + 2) * Math.sin(dotRad);

  return (
    <svg width={size} height={size}>
      {/* Tick marks */}
      {Array.from({ length: ticks }).map((_, i) => {
        const angle = (i / ticks) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const isMajor = i % 5 === 0;
        const innerR = outerRadius - (isMajor ? 12 : 6);
        return (
          <line
            key={i}
            x1={center + innerR * Math.cos(rad)}
            y1={center + innerR * Math.sin(rad)}
            x2={center + outerRadius * Math.cos(rad)}
            y2={center + outerRadius * Math.sin(rad)}
            stroke={i <= currentSecond ? "#842AEB" : "#D1D5DB"}
            strokeWidth={isMajor ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {/* Current second dot */}
      <circle cx={dotX} cy={dotY} r={4} fill="#842AEB" />
    </svg>
  );
}

// ─── Format Time ────────────────────────────────────────────────────────────

function formatTime(totalMs: number) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((totalMs % 1000) / 10);

  return {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    centiseconds: String(centiseconds).padStart(2, "0"),
    totalSeconds,
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TimerTool() {
  const [mode, setMode] = useState<Mode>("timer");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timerDuration, setTimerDuration] = useState(60); // seconds
  const [remainingMs, setRemainingMs] = useState(60 * 1000);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const accumulatedRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  // ── Stopwatch Controls ──────────────────────────────────────────────────

  function startStopwatch() {
    startTimeRef.current = Date.now();
    accumulatedRef.current = elapsedMs;
    setStatus("running");
    intervalRef.current = setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 16);
  }

  function pauseStopwatch() {
    clearTimer();
    accumulatedRef.current = elapsedMs;
    setStatus("paused");
  }

  function resetStopwatch() {
    clearTimer();
    setElapsedMs(0);
    accumulatedRef.current = 0;
    setStatus("idle");
  }

  // ── Countdown Timer Controls ────────────────────────────────────────────

  function startCountdown() {
    const startRemaining = status === "paused" ? remainingMs : timerDuration * 1000;
    if (status !== "paused") setRemainingMs(startRemaining);
    startTimeRef.current = Date.now();
    accumulatedRef.current = startRemaining;
    setStatus("running");
    intervalRef.current = setInterval(() => {
      const left = accumulatedRef.current - (Date.now() - startTimeRef.current);
      if (left <= 0) {
        clearTimer();
        setRemainingMs(0);
        setStatus("idle");
        // Vibrate on completion
        navigator.vibrate?.(200);
      } else {
        setRemainingMs(left);
      }
    }, 16);
  }

  function pauseCountdown() {
    clearTimer();
    accumulatedRef.current = remainingMs;
    setStatus("paused");
  }

  function resetCountdown() {
    clearTimer();
    setRemainingMs(timerDuration * 1000);
    setStatus("idle");
  }

  function addMinute() {
    if (mode === "timer" && status === "running") {
      accumulatedRef.current += 60_000;
      setRemainingMs((prev) => prev + 60_000);
    }
  }

  function selectPreset(seconds: number) {
    if (status === "running") return;
    clearTimer();
    setTimerDuration(seconds);
    setRemainingMs(seconds * 1000);
    setStatus("idle");
  }

  function switchMode(newMode: Mode) {
    clearTimer();
    setStatus("idle");
    setElapsedMs(0);
    setRemainingMs(timerDuration * 1000);
    accumulatedRef.current = 0;
    setMode(newMode);
  }

  // ── Derived values ──────────────────────────────────────────────────────

  const isStopwatch = mode === "stopwatch";
  const displayMs = isStopwatch ? elapsedMs : remainingMs;
  const time = formatTime(displayMs);
  const progress = isStopwatch ? 0 : 1 - remainingMs / (timerDuration * 1000);
  const ringSize = 220;

  return (
    <div className="pb-4 flex flex-col items-center">
      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-full p-1 mb-6 w-full max-w-[260px]">
        <button
          onClick={() => switchMode("stopwatch")}
          className={cn(
            "flex-1 py-2 rounded-full text-[14px] font-semibold transition-all",
            isStopwatch
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          )}
        >
          Stopwatch
        </button>
        <button
          onClick={() => switchMode("timer")}
          className={cn(
            "flex-1 py-2 rounded-full text-[14px] font-semibold transition-all",
            !isStopwatch
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          )}
        >
          Timer
        </button>
      </div>

      {/* Timer presets (countdown mode only) */}
      {!isStopwatch && (
        <div className="flex gap-2 mb-5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => selectPreset(p.seconds)}
              disabled={status === "running"}
              className={cn(
                "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                timerDuration === p.seconds
                  ? "bg-[#842AEB] text-white"
                  : "bg-gray-100 text-gray-600 active:bg-gray-200",
                status === "running" && "opacity-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Ring + Time Display */}
      <div className="relative flex items-center justify-center mb-6" style={{ width: ringSize, height: ringSize }}>
        {/* Ring */}
        {isStopwatch ? (
          <TickRing size={ringSize} seconds={time.totalSeconds} />
        ) : (
          <ProgressRing progress={progress} size={ringSize} />
        )}

        {/* Centered time */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {!isStopwatch && (
            <span className="text-[12px] font-semibold text-[#842AEB] uppercase tracking-wider mb-1">
              {status === "running" ? "Running" : status === "paused" ? "Paused" : "Ready"}
            </span>
          )}
          <div className="flex items-baseline">
            <span className="text-[48px] font-light text-gray-900 tabular-nums tracking-tight">
              {time.minutes}
            </span>
            <span className="text-[48px] font-light text-gray-900 mx-0.5">:</span>
            <span className="text-[48px] font-light text-gray-900 tabular-nums tracking-tight">
              {time.seconds}
            </span>
            {isStopwatch && (
              <span className="text-[20px] font-light text-gray-400 ml-1 tabular-nums">
                .{time.centiseconds}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Reset */}
        <button
          onClick={isStopwatch ? resetStopwatch : resetCountdown}
          disabled={status === "idle" && (isStopwatch ? elapsedMs === 0 : remainingMs === timerDuration * 1000)}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors disabled:opacity-30"
          aria-label="Reset"
        >
          <RotateCcw className="h-5 w-5 text-gray-600" />
        </button>

        {/* Start / Pause */}
        <button
          onClick={() => {
            if (status === "running") {
              isStopwatch ? pauseStopwatch() : pauseCountdown();
            } else {
              isStopwatch ? startStopwatch() : startCountdown();
            }
          }}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center active:scale-[0.94] transition-transform shadow-lg",
            status === "running"
              ? "bg-gray-800 shadow-gray-800/25"
              : "bg-[#842AEB] shadow-purple-500/25"
          )}
          aria-label={status === "running" ? "Pause" : "Start"}
        >
          {status === "running" ? (
            <Pause className="h-7 w-7 text-white" fill="white" />
          ) : (
            <Play className="h-7 w-7 text-white ml-1" fill="white" />
          )}
        </button>

        {/* +1 min (timer mode only) / empty space for stopwatch */}
        {!isStopwatch ? (
          <button
            onClick={addMinute}
            disabled={status !== "running"}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors disabled:opacity-30"
            aria-label="Add 1 minute"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}
      </div>
    </div>
  );
}

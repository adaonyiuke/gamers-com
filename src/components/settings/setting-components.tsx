"use client";

import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Section wrapper ─────────────────────────────────────────── */

export function SettingSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

/* ── Toggle row ──────────────────────────────────────────────── */

export function SettingToggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[17px] text-gray-900">{label}</p>
        {description && (
          <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ease-in-out",
          value ? "bg-[#34C759]" : "bg-gray-300",
          disabled && "opacity-50"
        )}
      >
        <span
          className={cn(
            "inline-block h-[27px] w-[27px] rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out mt-[2px]",
            value ? "translate-x-[22px]" : "translate-x-[2px]"
          )}
        />
      </button>
    </div>
  );
}

/* ── Select / picker row ─────────────────────────────────────── */

export function SettingSelect({
  label,
  description,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[17px] text-gray-900">{label}</p>
          {description && (
            <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={cn(
              "flex-1 rounded-[10px] py-2.5 text-[15px] font-medium transition-colors",
              value === opt.value
                ? "bg-[#007AFF] text-white"
                : "bg-[#F2F2F7] text-gray-700",
              disabled && "opacity-50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Number stepper row ──────────────────────────────────────── */

export function SettingStepper({
  label,
  description,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[17px] text-gray-900">{label}</p>
        {description && (
          <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          className="h-8 w-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[17px] font-semibold text-gray-600 disabled:opacity-30"
        >
          −
        </button>
        <span className="text-[17px] font-semibold text-gray-900 w-8 text-center tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          className="h-8 w-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[17px] font-semibold text-gray-600 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ── Tappable row (link-like) ────────────────────────────────── */

export function SettingRow({
  label,
  description,
  detail,
  icon,
  onClick,
  destructive,
}: {
  label: string;
  description?: string;
  detail?: string;
  icon?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors"
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[17px]",
            destructive ? "text-red-500" : "text-gray-900"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {detail && (
        <span className="text-[15px] text-gray-400 shrink-0">{detail}</span>
      )}
      <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180 shrink-0" />
    </button>
  );
}

/* ── Glass page header ───────────────────────────────────────── */

export function SettingsHeader({
  title,
  onBack,
  rightAction,
}: {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
}) {
  return (
    <div
      className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
      style={{
        background: "rgba(242,242,247,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <button
        onClick={onBack}
        className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="text-[17px]">Back</span>
      </button>
      <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center">
        {title}
      </h1>
      <div className="w-14 flex justify-end">{rightAction}</div>
    </div>
  );
}

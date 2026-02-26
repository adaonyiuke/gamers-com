"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Info } from "lucide-react";
import { useGroupId } from "@/components/providers/group-provider";
import { useCreateGame, useUpdateGame } from "@/lib/queries/games";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/lib/supabase/types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

const SCORING_OPTIONS = [
  { value: "highest_wins", label: "Highest Wins" },
  { value: "lowest_wins", label: "Lowest Wins" },
  { value: "manual_winner", label: "Manual Winner" },
] as const;

const SCORING_DESCRIPTIONS: Record<string, string> = {
  highest_wins: "The player with the highest score wins the game.",
  lowest_wins: "The player with the lowest score wins (e.g., golf).",
  manual_winner: "You pick the winner yourself — no scores needed.",
};

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  abbreviation: z
    .string()
    .min(1, "Abbreviation is required")
    .max(2, "Max 2 characters"),
  scoringType: z.enum(["highest_wins", "lowest_wins", "manual_winner"]),
});

type FormData = z.infer<typeof schema>;

function generateAbbreviation(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  // Use first 2 chars, uppercase
  return trimmed.substring(0, 2).toUpperCase();
}

const inputClasses =
  "w-full bg-white rounded-[14px] px-4 py-3.5 text-[17px] border border-gray-200 focus:border-[#007AFF] focus:outline-none";

interface GameFormModalProps {
  mode: "create" | "edit";
  game?: GameRow;
  onClose: () => void;
  onSuccess: () => void;
}

export function GameFormModal({
  mode,
  game,
  onClose,
  onSuccess,
}: GameFormModalProps) {
  const { groupId } = useGroupId();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: game?.name ?? "",
      abbreviation: game?.abbreviation ?? "",
      scoringType:
        (game?.scoring_type as FormData["scoringType"]) ?? "highest_wins",
    },
  });

  const name = watch("name");
  const abbreviation = watch("abbreviation");
  const scoringType = watch("scoringType");

  // Auto-suggest abbreviation when name changes (only if user hasn't manually edited)
  const [abbrManuallyEdited, setAbbrManuallyEdited] = useState(
    mode === "edit"
  );
  useEffect(() => {
    if (!abbrManuallyEdited && name) {
      setValue("abbreviation", generateAbbreviation(name));
    }
  }, [name, abbrManuallyEdited, setValue]);

  const mutation = mode === "create" ? createGame : updateGame;
  const isPending = isSubmitting || mutation.isPending;

  const onSubmit = async (data: FormData) => {
    if (!groupId && mode === "create") return;

    try {
      if (mode === "create") {
        await createGame.mutateAsync({
          groupId: groupId!,
          name: data.name,
          abbreviation: data.abbreviation.toUpperCase(),
          scoringType: data.scoringType,
        });
      } else if (game) {
        await updateGame.mutateAsync({
          id: game.id,
          name: data.name,
          abbreviation: data.abbreviation.toUpperCase(),
          scoringType: data.scoringType,
        });
      }
      onSuccess();
    } catch {
      // Error shown via mutation.error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-[400px] bg-[#F2F2F7] rounded-[24px] max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center px-5 pt-5 pb-3">
          <button
            onClick={onClose}
            className="text-gray-400 active:opacity-60 transition-opacity"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="flex-1 text-center text-[17px] font-semibold text-gray-900 mr-6">
            {mode === "create" ? "Add Game" : "Edit Game"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-5 pb-10 space-y-5"
        >
          {/* Name */}
          <div>
            <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
              Name
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Catan, Uno, Chess"
              className={cn(
                inputClasses,
                errors.name && "border-red-400 focus:border-red-400"
              )}
            />
            {errors.name && (
              <p className="text-[13px] text-red-500 mt-1 px-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Abbreviation */}
          <div>
            <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
              Abbreviation
            </label>
            <input
              {...register("abbreviation", {
                onChange: () => setAbbrManuallyEdited(true),
              })}
              placeholder="e.g. CA"
              maxLength={2}
              value={abbreviation.toUpperCase()}
              className={cn(
                inputClasses,
                "w-24 text-center uppercase tracking-widest font-bold",
                errors.abbreviation && "border-red-400 focus:border-red-400"
              )}
            />
            {errors.abbreviation && (
              <p className="text-[13px] text-red-500 mt-1 px-1">
                {errors.abbreviation.message}
              </p>
            )}
            <p className="text-[12px] text-gray-400 mt-1 px-1">
              Shown on game tiles. Max 2 characters.
            </p>
          </div>

          {/* Scoring Type */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                Scoring Type
              </label>
              <button
                type="button"
                onClick={() => setShowScoringInfo(!showScoringInfo)}
                className="text-[#007AFF] active:opacity-60 transition-opacity"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>

            {showScoringInfo && (
              <div className="bg-blue-50 rounded-[14px] px-4 py-3 mb-3 space-y-2">
                {SCORING_OPTIONS.map((opt) => (
                  <div key={opt.value}>
                    <p className="text-[13px] font-semibold text-gray-800">
                      {opt.label}
                    </p>
                    <p className="text-[13px] text-gray-600">
                      {SCORING_DESCRIPTIONS[opt.value]}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-200/60 rounded-[14px] p-1 flex">
              {SCORING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("scoringType", opt.value)}
                  className={cn(
                    "flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all text-center",
                    scoringType === opt.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {mutation.error && (
            <div className="bg-red-50 rounded-[14px] px-4 py-3">
              <p className="text-[15px] text-red-600">
                {(mutation.error as Error).message ??
                  `Failed to ${mode === "create" ? "create" : "update"} game`}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || (!groupId && mode === "create")}
            className={cn(
              "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
              (isPending || (!groupId && mode === "create")) && "opacity-50"
            )}
          >
            {isPending
              ? mode === "create"
                ? "Adding..."
                : "Saving..."
              : mode === "create"
                ? "Add Game"
                : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGroupId } from "@/components/providers/group-provider";
import { useCreateGame } from "@/lib/queries/games";
import { cn } from "@/lib/utils/cn";

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
  return trimmed.substring(0, 2).toUpperCase();
}

const inputClasses =
  "w-full bg-white rounded-[14px] px-4 py-3.5 text-[17px] border border-gray-200 focus:border-[#007AFF] focus:outline-none";

export default function NewGamePage() {
  const router = useRouter();
  const { groupId, loading: groupLoading } = useGroupId();
  const createGame = useCreateGame();
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
      name: "",
      abbreviation: "",
      scoringType: "highest_wins",
    },
  });

  const name = watch("name");
  const abbreviation = watch("abbreviation");
  const scoringType = watch("scoringType");

  // Auto-suggest abbreviation when name changes
  const [abbrManuallyEdited, setAbbrManuallyEdited] = useState(false);
  useEffect(() => {
    if (!abbrManuallyEdited && name) {
      setValue("abbreviation", generateAbbreviation(name));
    }
  }, [name, abbrManuallyEdited, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!groupId) return;

    try {
      await createGame.mutateAsync({
        groupId,
        name: data.name,
        abbreviation: data.abbreviation.toUpperCase(),
        scoringType: data.scoringType,
      });
      router.push("/games");
    } catch {
      // Error shown via createGame.error
    }
  };

  if (groupLoading) {
    return (
      <div className="pb-28">
        <div
          className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
          style={{
            background: "rgba(242,242,247,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center">
            Add Game
          </h1>
        </div>
        <div className="px-5 mt-4 flex items-center justify-center py-20">
          <p className="text-gray-400 text-[15px]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Glass header */}
      <div
        className="sticky top-0 z-40 px-5 pt-14 pb-3 flex items-center gap-3"
        style={{
          background: "rgba(242,242,247,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center text-[#007AFF] -ml-1 active:opacity-60 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px]">Back</span>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 flex-1 text-center mr-14">
          Add Game
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-5 mt-4 space-y-5">
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

        {/* Scoring Type - Segmented Control */}
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
        {createGame.error && (
          <div className="bg-red-50 rounded-[14px] px-4 py-3">
            <p className="text-[15px] text-red-600">
              {(createGame.error as Error).message ?? "Failed to create game"}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || createGame.isPending || !groupId}
          className={cn(
            "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
            (isSubmitting || createGame.isPending || !groupId) && "opacity-50"
          )}
        >
          {isSubmitting || createGame.isPending ? "Adding..." : "Add Game"}
        </button>
      </form>
    </div>
  );
}

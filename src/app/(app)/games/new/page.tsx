"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  minPlayers: z.coerce.number().int().min(1, "Min 1 player"),
  maxPlayers: z.string().optional(),
  scoringType: z.enum(["highest_wins", "lowest_wins", "manual_winner"]),
});

type FormData = z.infer<typeof schema>;

const inputClasses =
  "w-full bg-white rounded-[14px] px-4 py-3.5 text-[17px] border border-gray-200 focus:border-[#007AFF] focus:outline-none";

export default function NewGamePage() {
  const router = useRouter();
  const { groupId } = useGroupId();
  const createGame = useCreateGame();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      minPlayers: 1,
      maxPlayers: "",
      scoringType: "highest_wins",
    },
  });

  const scoringType = watch("scoringType");

  const onSubmit = async (data: FormData) => {
    if (!groupId) return;

    await createGame.mutateAsync({
      groupId,
      name: data.name,
      minPlayers: data.minPlayers,
      maxPlayers:
        data.maxPlayers ? parseInt(data.maxPlayers, 10) || undefined : undefined,
      scoringType: data.scoringType,
    });

    router.push("/games");
  };

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

        {/* Player Counts */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
              Min Players
            </label>
            <input
              {...register("minPlayers")}
              type="number"
              min={1}
              className={cn(
                inputClasses,
                errors.minPlayers && "border-red-400 focus:border-red-400"
              )}
            />
            {errors.minPlayers && (
              <p className="text-[13px] text-red-500 mt-1 px-1">
                {errors.minPlayers.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
              Max Players
            </label>
            <input
              {...register("maxPlayers")}
              type="number"
              min={1}
              placeholder="Optional"
              className={cn(
                inputClasses,
                errors.maxPlayers && "border-red-400 focus:border-red-400"
              )}
            />
            {errors.maxPlayers && (
              <p className="text-[13px] text-red-500 mt-1 px-1">
                {errors.maxPlayers.message}
              </p>
            )}
          </div>
        </div>

        {/* Scoring Type - Segmented Control */}
        <div>
          <label className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block px-1">
            Scoring Type
          </label>
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
          disabled={isSubmitting || createGame.isPending}
          className={cn(
            "w-full bg-black text-white rounded-[14px] py-4 text-[17px] font-semibold active:scale-[0.98] transition-transform",
            (isSubmitting || createGame.isPending) && "opacity-50"
          )}
        >
          {isSubmitting || createGame.isPending ? "Adding..." : "Add Game"}
        </button>
      </form>
    </div>
  );
}

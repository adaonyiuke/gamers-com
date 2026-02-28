"use client";

import Image from "next/image";
import { useState } from "react";

const TILE_COLORS = [
  "#007AFF",
  "#FF9500",
  "#FF2D55",
  "#5856D6",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#00C7BE",
];

interface GameTileProps {
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  imageStatus?: string | null;
  abbreviation: string;
  colorIndex: number;
  size: "sm" | "lg";
}

export function GameTile({
  thumbnailUrl,
  imageUrl,
  imageStatus,
  abbreviation,
  colorIndex,
  size,
}: GameTileProps) {
  const [imgError, setImgError] = useState(false);

  const px = size === "sm" ? 48 : 64;
  const radius = size === "sm" ? "rounded-[10px]" : "rounded-[14px]";
  const textSize = size === "sm" ? "text-[17px]" : "text-[22px]";
  const color = TILE_COLORS[colorIndex % TILE_COLORS.length];

  // Use thumbnail for small tiles, full image for large
  const src =
    size === "sm"
      ? (thumbnailUrl ?? imageUrl)
      : (imageUrl ?? thumbnailUrl);

  const showImage = imageStatus === "ok" && !!src && !imgError;

  if (showImage) {
    return (
      <div
        className={`${radius} overflow-hidden shrink-0 bg-gray-100`}
        style={{ width: px, height: px }}
      >
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: colored tile with abbreviation
  return (
    <div
      className={`${radius} flex items-center justify-center text-white ${textSize} font-bold shrink-0`}
      style={{ width: px, height: px, backgroundColor: color }}
    >
      {abbreviation}
    </div>
  );
}

export { TILE_COLORS };

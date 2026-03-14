import { notFound } from "next/navigation";
import { UILabContent } from "./ui-lab-content";

/**
 * Developer-only UI lab for previewing and standardizing the design system.
 * Gated: returns 404 in production so regular users never see it.
 */
export default function UILabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <UILabContent />;
}

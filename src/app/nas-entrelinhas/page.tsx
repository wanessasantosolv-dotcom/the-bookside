"use client";

import { Suspense } from "react";
import { Oraculo } from "@/components/entrelinhas/Oraculo";

export default function NasEntrelinhasPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-creme" />}>
      <Oraculo />
    </Suspense>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClube } from "@/components/clube/ClubeContexto";

/** O feed do clube agora fica no início do clube (links antigos levam para lá). */
export default function ClubeFeedPage() {
  const { clube } = useClube();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/clubes/${clube.id}#novidades`);
  }, [clube.id, router]);
  return null;
}

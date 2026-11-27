"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** o ranking agora fica dentro de membros */
export default function RankingAntigo() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/clubes/${id}/membros#t-liga`);
  }, [id, router]);
  return null;
}

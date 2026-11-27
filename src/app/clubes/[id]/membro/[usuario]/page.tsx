"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** o perfil do membro agora é o perfil da pessoa */
export default function MembroAntigo() {
  const { usuario } = useParams<{ usuario: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/u/${usuario}`);
  }, [usuario, router]);
  return null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** os convites agora ficam num painel na própria Comunidade */
export default function ConvitesAntigos() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/comunidade");
  }, [router]);
  return null;
}

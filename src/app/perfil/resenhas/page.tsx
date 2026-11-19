"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** as resenhas agora ficam dentro do perfil (aba "resenhas") */
export default function ResenhasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/perfil?aba=resenhas");
  }, [router]);
  return null;
}

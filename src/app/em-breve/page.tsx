import { redirect } from "next/navigation";

/** Endereço antigo: os clubes já existem. */
export default function EmBrevePage() {
  redirect("/clubes");
}

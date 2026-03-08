import { redirect } from "next/navigation";

export default function AccountDangerAliasPage() {
  redirect("/account/privacy?focus=deletion");
}

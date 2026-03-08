import { redirect } from "next/navigation";

export default function AccountSessionsAliasPage() {
  redirect("/account/security?focus=sessions");
}

import { redirect } from "next/navigation";

export default function AccountPasswordAliasPage() {
  redirect("/account/security?focus=password");
}

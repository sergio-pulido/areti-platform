import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountBillingPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Billing"
      title="Billing"
      description="Plans, invoices, and payment methods."
      emptyTitle="Billing is coming soon"
      emptyDescription="Billing is intentionally out of scope in this account rollout and will be enabled with dedicated payment integration."
      primaryHref="/account"
      primaryLabel="Back to account"
      secondaryHref="/account/settings"
      secondaryLabel="Open settings"
    />
  );
}

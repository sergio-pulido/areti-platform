import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountRewardsPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Achievements"
      title="Rewards"
      description="Progress and gamification achievements."
      emptyTitle="Rewards are coming soon"
      emptyDescription="Rewards are currently deferred and shown as a disabled section in account navigation."
      primaryHref="/account"
      primaryLabel="Back to account"
      secondaryHref="/practices"
      secondaryLabel="Open practices"
    />
  );
}

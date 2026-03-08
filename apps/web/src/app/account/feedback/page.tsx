import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountFeedbackPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Communication"
      title="Feedback"
      description="View and manage your submitted feedback messages."
      emptyTitle="Feedback inbox"
      emptyDescription="Feedback history is not yet populated for this account. As feedback records are connected, this page will show status and response history."
      primaryHref="/community/resources"
      primaryLabel="Explore resources"
      secondaryHref="/account/notifications"
      secondaryLabel="Open notifications"
    />
  );
}

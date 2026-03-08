import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountCommentsPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Saved content"
      title="Comments"
      description="View all comments you have written."
      emptyTitle="Comment history"
      emptyDescription="Comment activity will be listed chronologically here when discussion persistence is enabled in community modules."
      primaryHref="/community"
      primaryLabel="Open community"
      secondaryHref="/community/challenges"
      secondaryLabel="Open challenges"
    />
  );
}

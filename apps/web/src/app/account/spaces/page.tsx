import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountSpacesPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Saved content"
      title="My Spaces"
      description="View your communities and spaces."
      emptyTitle="Membership spaces"
      emptyDescription="When space-level membership is connected, your joined circles and groups will appear in this section."
      primaryHref="/community"
      primaryLabel="Open circles"
      secondaryHref="/community/events"
      secondaryLabel="Open community events"
    />
  );
}

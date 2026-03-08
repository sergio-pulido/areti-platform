import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountDocumentsPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Saved content"
      title="Documents"
      description="Your uploaded documents and attachments."
      emptyTitle="Document vault"
      emptyDescription="Document uploads are not yet enabled for account storage in this build. This page is prepared for upcoming file-management wiring."
      primaryHref="/journal"
      primaryLabel="Open journal"
      secondaryHref="/library"
      secondaryLabel="Open library"
    />
  );
}

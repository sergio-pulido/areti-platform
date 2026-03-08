import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountLikesPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Saved content"
      title="Likes"
      description="View all the content you have liked."
      emptyTitle="Liked content"
      emptyDescription="Like tracking is ready for wiring. This page will list your liked lessons, practices, and community content."
      primaryHref="/library"
      primaryLabel="Browse library"
      secondaryHref="/practices"
      secondaryLabel="Browse practices"
    />
  );
}

import { AccountPlaceholderPage } from "@/components/account/account-placeholder-page";

export default function AccountFavouritesPage() {
  return (
    <AccountPlaceholderPage
      eyebrow="Saved content"
      title="Favourites"
      description="View all the content you have favourited."
      emptyTitle="Favourite content"
      emptyDescription="Favourites will appear here once bookmark persistence is enabled across content domains."
      primaryHref="/library"
      primaryLabel="Open library"
      secondaryHref="/community/resources"
      secondaryLabel="Open community resources"
    />
  );
}

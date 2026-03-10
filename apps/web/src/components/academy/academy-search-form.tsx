import { Search } from "lucide-react";

type AcademySearchFormProps = {
  defaultQuery?: string;
  className?: string;
};

export function AcademySearchForm({ defaultQuery, className }: AcademySearchFormProps) {
  return (
    <form action="/academy/search" method="get" className={className}>
      <label htmlFor="academy-search-input" className="sr-only">
        Search traditions, thinkers, works, and concepts
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 text-night-300" size={16} />
        <input
          id="academy-search-input"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder="Search traditions, thinkers, works, and concepts"
          className="w-full rounded-xl border border-night-700 bg-night-950/80 py-2 pl-9 pr-4 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
        />
      </div>
    </form>
  );
}

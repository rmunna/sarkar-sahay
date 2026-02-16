import { getCategories, getAllGuides } from "@/lib/guides";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import CategorySection from "@/components/CategorySection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Categories",
  description: "Browse all government service categories — Identity Documents, Schemes, Tax, Certificates & more.",
};

export default function CategoriesPage() {
  const categories = getCategories();
  const guides = getAllGuides();
  const searchGuides = guides.map((g) => ({
    slug: g.slug,
    title: g.title,
    description: g.description,
    category: g.category,
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">All Categories</h1>
        <SearchBar guides={searchGuides} />
      </div>

      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet. Guides are being generated!</p>
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => {
            const catGuides = guides
              .filter((g) => g.category === cat.name)
              .map((g) => ({ slug: g.slug, title: g.title, description: g.description }));
            return (
              <CategorySection
                key={cat.name}
                name={cat.name}
                count={cat.count}
                guides={catGuides}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

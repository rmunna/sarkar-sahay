import { getCategories, getAllGuides } from "@/lib/guides";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Categories — CitizenNest",
  description: "Browse all government service categories — Identity Documents, Schemes, Tax, Certificates & more.",
};

export default function CategoriesPage() {
  const categories = getCategories();
  const guides = getAllGuides();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">All Categories</h1>

      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet. Guides are being generated!</p>
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => {
            const catGuides = guides.filter((g) => g.category === cat.name);
            return (
              <section key={cat.name}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {cat.name}
                  <span className="text-sm font-normal text-gray-400">({cat.count} guides)</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {catGuides.map((guide) => (
                    <a
                      key={guide.slug}
                      href={`/guide/${guide.slug}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-sm transition"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{guide.title}</h3>
                      <p className="text-sm text-gray-500">{guide.description}</p>
                    </a>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

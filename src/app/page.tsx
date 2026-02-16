import { getAllGuides, getCategories } from "@/lib/guides";

export default function Home() {
  const guides = getAllGuides();
  const categories = getCategories();

  return (
    <div>
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Government Services, <span className="text-orange-600">Made Simple</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Step-by-step guides for every Indian government service — Aadhaar, PAN, Ration Card, Schemes, Jobs, Exams & more. Always accurate. Always updated.
        </p>
      </section>

      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <a
                key={cat.name}
                href={`/categories/${encodeURIComponent(cat.name.toLowerCase())}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-sm transition"
              >
                <div className="font-semibold text-gray-900">{cat.name}</div>
                <div className="text-sm text-gray-500">{cat.count} guides</div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-bold mb-6">
          {guides.length > 0 ? "Latest Guides" : "Coming Soon"}
        </h2>
        {guides.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-500">🚀 Guides are being generated...</p>
            <p className="text-gray-400 mt-2">Our AI agents are researching and writing. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <a
                key={guide.slug}
                href={`/guide/${guide.slug}`}
                className="block border border-gray-200 rounded-lg p-6 hover:border-orange-400 hover:shadow-sm transition"
              >
                <div className="text-xs font-medium text-orange-600 uppercase mb-2">
                  {guide.category}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {guide.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                <div className="text-xs text-gray-400">
                  Last updated: {guide.lastUpdated}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

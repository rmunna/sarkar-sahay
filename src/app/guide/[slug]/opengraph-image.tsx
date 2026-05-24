import { ImageResponse } from "next/og";
import { getGuideBySlug, getAllGuideSlugs } from "@/lib/guides";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const categoryEmojis: Record<string, string> = {
  "Identity Documents": "🪪",
  "Government Schemes": "🏛️",
  "Tax & Finance": "💰",
  "Jobs & Exams": "💼",
  "Certificates": "📜",
  "Utilities": "⚡",
  "Property & Legal": "🏠",
  "Food & Ration": "🍚",
  "State Schemes": "📍",
};

/** Replace characters Satori cannot render without dynamic font fetching.
 *  Satori uses a subset font; ₹ (U+20B9) triggers a failed Google Fonts request.
 */
function sanitizeForOG(text: string): string {
  return text
    .replace(/₹/g, "Rs.")
    .replace(/…/g, "...") // ellipsis
    .replace(/[‘’]/g, "'") // curly single quotes
    .replace(/[“”]/g, '"'); // curly double quotes
}

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  const title = sanitizeForOG(guide?.title ?? "Guide");
  const category = guide?.category ?? "";
  const emoji = categoryEmojis[category] || "📋";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Gradient blob top-right */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, #fff7ed 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 60px 60px 70px",
            width: "75%",
            height: "100%",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: title.length > 60 ? 36 : 42,
              fontWeight: 700,
              color: "#1f2937",
              lineHeight: 1.25,
              display: "-webkit-box",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineClamp: 3,
              maxHeight: "160px",
            }}
          >
            {title}
          </div>

          {/* Category badge */}
          {category && (
            <div
              style={{
                display: "flex",
                marginTop: 24,
              }}
            >
              <div
                style={{
                  backgroundColor: "#ea580c",
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: 50,
                  display: "flex",
                }}
              >
                {category}
              </div>
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#ea580c",
                display: "flex",
              }}
            >
              CitizenNest 🏠
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#9ca3af",
                display: "flex",
              }}
            >
              citizennest.com
            </div>
          </div>
        </div>

        {/* Right side emoji */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "25%",
            fontSize: 120,
          }}
        >
          {emoji}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #ea580c, #f97316)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}

export const alt = "CitizenNest Guide";

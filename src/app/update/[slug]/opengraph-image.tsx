import { ImageResponse } from "next/og";
import { getUpdateBySlug } from "@/lib/updates";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const stageThemes: Record<string, { bg: string; accent: string; label: string }> = {
  result:          { bg: "#F0FDF4", accent: "#16A34A", label: "Result" },
  notification:    { bg: "#EFF6FF", accent: "#2563EB", label: "Notification" },
  "admit-card":    { bg: "#F5F3FF", accent: "#7C3AED", label: "Admit Card" },
  "answer-key":    { bg: "#F0FDFA", accent: "#0D9488", label: "Answer Key" },
  cutoff:          { bg: "#FFF1F2", accent: "#E11D48", label: "Cut-off" },
  "exam-schedule": { bg: "#FFFBEB", accent: "#D97706", label: "Exam Schedule" },
  registration:    { bg: "#EEF2FF", accent: "#4F46E5", label: "Registration" },
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const update = await getUpdateBySlug(slug);

  const title = update?.title || "Exam Update — CitizenNest";
  const org = update?.organization || "CitizenNest";
  const stage = update?.stage || "notification";
  const theme = stageThemes[stage] || stageThemes.notification;
  const dateStr = update?.publishedDate
    ? new Date(update.publishedDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  // Truncate very long titles for layout
  const displayTitle = title.length > 80 ? title.slice(0, 77) + "…" : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.bg,
          padding: "56px 64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top row: stage pill + site name */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "48px" }}>
          <div
            style={{
              backgroundColor: theme.accent,
              color: "white",
              padding: "10px 24px",
              borderRadius: "24px",
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {theme.label}
          </div>
          <div
            style={{
              marginLeft: "auto",
              color: "#6B7280",
              fontSize: "26px",
              fontWeight: 600,
            }}
          >
            citizennest.com
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: displayTitle.length > 55 ? "46px" : "58px",
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.25,
            flex: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {displayTitle}
        </div>

        {/* Footer: org + date */}
        <div style={{ display: "flex", alignItems: "center", marginTop: "40px" }}>
          <div
            style={{
              color: theme.accent,
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            {org}
          </div>
          {dateStr && (
            <div
              style={{
                marginLeft: "auto",
                color: "#9CA3AF",
                fontSize: "26px",
              }}
            >
              {dateStr}
            </div>
          )}
        </div>

        {/* Bottom accent stripe */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundColor: theme.accent,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

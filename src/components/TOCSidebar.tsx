"use client";

import { useEffect, useRef } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TOCSidebarProps {
  headings: Heading[];
}

export default function TOCSidebar({ headings }: TOCSidebarProps) {
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    const links = new Map<string, HTMLAnchorElement>();
    document.querySelectorAll<HTMLAnchorElement>(".toc-sidebar-link").forEach((el) => {
      const href = el.getAttribute("href");
      if (href?.startsWith("#")) links.set(href.slice(1), el);
    });

    const setActive = (id: string) => {
      if (activeRef.current === id) return;
      links.forEach((el) => el.classList.remove("active"));
      links.get(id)?.classList.add("active");
      activeRef.current = id;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -75% 0px" }
    );

    document
      .querySelectorAll<HTMLElement>(".guide-content h2, .guide-content h3")
      .forEach((el) => observer.observe(el));

    // Set first heading active on mount
    const firstId = headings[0]?.id;
    if (firstId) setActive(firstId);

    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold text-[#0f2744] uppercase tracking-wider mb-3">
        On this page
      </h3>
      <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={`toc-link toc-sidebar-link ${heading.level === 3 ? "pl-6 text-xs" : ""}`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

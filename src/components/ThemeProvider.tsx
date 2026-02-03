"use client";

import { useEffect } from "react";

/**
 * Syncs the document with the system color scheme so Tailwind's dark: variant
 * and any CSS that uses the data-theme attribute follow the user's OS preference.
 * No manual toggle — follows system only.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const setTheme = () => {
      document.documentElement.setAttribute(
        "data-theme",
        media.matches ? "dark" : "light"
      );
    };
    setTheme();
    media.addEventListener("change", setTheme);
    return () => media.removeEventListener("change", setTheme);
  }, []);

  return <>{children}</>;
}

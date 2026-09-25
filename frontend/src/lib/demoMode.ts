// Vite replaces this flag at build time. Standard builds omit demo entry;
// the public portfolio build opts in explicitly.
export const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

export const isDemoAccount = (email?: string) =>
  demoMode && Boolean(email?.toLowerCase().endsWith("@retro.demo"));

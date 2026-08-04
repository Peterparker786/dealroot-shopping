// Category list shared across the whole app.
// Defaults are used until the admin adds/removes categories, which are
// then persisted in localStorage so they survive page reloads.

export const DEFAULT_CATEGORIES = [
  { name: "Makeup", emoji: "💄", color: "#FFE4EC" },
  { name: "Skincare", emoji: "✨", color: "#E4F3FF" },
  { name: "Haircare", label: "Hair Care", emoji: "🧴", color: "#FFF1D8" },
  { name: "Fragrance", emoji: "🌸", color: "#EEE9FF" },
  { name: "Bath & Body", emoji: "🫧", color: "#E2F8F0" },
];

const STORAGE_KEY = "dealroot_categories";

export function getStoredCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }

  return DEFAULT_CATEGORIES;
}

export function saveStoredCategories(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}
/**
 * @file page.tsx
 * @description Asset categories — manage types used for tagging and registration (sidebar: Assets → Categories).
 */

import { CategoriesView } from "@/features/assets/categories-view";

export const metadata = {
  title: "Asset Categories | IT Management System",
};

export default function CategoriesPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Asset categories</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define categories (PC, Laptop, Monitor, …) and the short prefix used in auto-generated asset tags.
        </p>
      </div>

      <CategoriesView />
    </div>
  );
}

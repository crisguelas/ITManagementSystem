/**
 * @file page.tsx
 * @description Legacy categories route; redirects to Assets module.
 */

import { redirect } from "next/navigation";

export const metadata = {
  title: "Asset Categories | IT Management System",
};

export default function CategoriesPage() {
  redirect("/assets");
}

/**
 * @file page.tsx
 * @description Main Assets module page with tabs for inventory and categories.
 */

import { AssetsView } from "@/features/assets/assets-view";

export const metadata = {
  title: "IT Assets | IT Management System",
};

export default function AssetsPage() {
  return <AssetsView />;
}

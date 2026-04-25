/**
 * @file page.tsx
 * @description Main Assets module page for IT asset inventory.
 */

import { AssetsView } from "@/features/assets/assets-view";

export const metadata = {
  title: "IT Assets | IT Management System",
};

export default function AssetsPage() {
  return <AssetsView />;
}

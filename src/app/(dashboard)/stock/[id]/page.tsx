import { redirect } from "next/navigation";

export default async function LegacyStockItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/inventory/${id}`);
}

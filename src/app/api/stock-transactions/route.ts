/**
 * @file route.ts
 * @description API routes for Stock Transaction collection.
 * GET: list all transactions. POST: create a new transaction (adjusts quantity atomically).
 */

import { NextResponse } from "next/server";

import { requireSession } from "@/lib/api-auth";
import { stockTransactionSchema } from "@/lib/validations/stock.schema";
import {
  getStockTransactions,
  createStockTransaction,
} from "@/lib/services/stock.service";

/** GET /api/stock-transactions — returns all stock transactions */
export async function GET() {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;

    const transactions = await getStockTransactions();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error("[StockTransactionsAPI] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock transactions" },
      { status: 500 }
    );
  }
}

/** POST /api/stock-transactions — records a new transaction and updates quantity atomically */
export async function POST(request: Request) {
  try {
    const authResult = await requireSession();
    if (authResult.response) return authResult.response;
    const { session } = authResult;

    const body: unknown = await request.json();
    const parsed = stockTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    /* Pass the authenticated user's id as the performer */
    const transaction = await createStockTransaction(parsed.data, session.user.id);
    return NextResponse.json(
      { success: true, data: transaction },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create stock transaction";
    console.error("[StockTransactionsAPI] POST error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

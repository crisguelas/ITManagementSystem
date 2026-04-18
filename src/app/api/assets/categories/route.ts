/**
 * @file route.ts
 * @description API Routes for Asset Categories.
 */

import { NextResponse } from "next/server";
import { getCategories, createCategory } from "@/lib/services/asset.service";
import { categorySchema } from "@/lib/validations/asset.schema";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("[API_CATEGORIES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    /* Validate body with Zod */
    const validationResult = categorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    /* Call Service */
    const newCategory = await createCategory(validationResult.data);
    
    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error("[API_CATEGORIES_POST]", error);
    
    /* Handle unique constraint errors thrown by service */
    if (error.message && error.message.includes("already exists")) {
       return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while creating the category" },
      { status: 500 }
    );
  }
}

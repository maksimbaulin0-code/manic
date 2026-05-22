import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, price } = data;
    if (!id || price === undefined) return NextResponse.json({ error: "id and price required" }, { status: 400 });
    await sql`UPDATE services SET price=${price} WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

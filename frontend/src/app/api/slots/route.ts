import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM slots WHERE status='free'`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { date, time } = data;
    if (!date || !time) return NextResponse.json({ error: "date and time required" }, { status: 400 });
    const result = await sql`INSERT INTO slots (date, time, status) VALUES (${date}, ${time}, 'free') RETURNING id`;
    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await sql`DELETE FROM slots WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

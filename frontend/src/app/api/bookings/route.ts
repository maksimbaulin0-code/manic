import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT b.id, s.name, s.price, sl.date, sl.time, b.comment, b.photo_wish
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN slots sl ON b.slot_id = sl.id
      ORDER BY b.id DESC
    `;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

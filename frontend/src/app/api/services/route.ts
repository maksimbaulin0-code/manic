import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      SELECT s.*, c.name as category_name, c.icon as category_icon
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ORDER BY c.sort_order, s.id
    `;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, price, category_id } = data;
    if (!name || !category_id) return NextResponse.json({ error: "name and category_id required" }, { status: 400 });
    const result = await sql`INSERT INTO services (name, price, category_id) VALUES (${name}, ${price || 0}, ${category_id}) RETURNING id`;
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
    await sql`DELETE FROM services WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, price } = data;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (name) {
      await sql`UPDATE services SET name=${name} WHERE id=${id}`;
    }
    if (price !== undefined) {
      await sql`UPDATE services SET price=${price} WHERE id=${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

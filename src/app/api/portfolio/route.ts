import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM portfolio ORDER BY id DESC`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const description = formData.get('description') as string;
    
    if (!photo) return NextResponse.json({ error: "photo required" }, { status: 400 });

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "IMGBB_API_KEY is not set" }, { status: 500 });

    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');

    const imgbbFormData = new FormData();
    imgbbFormData.append('image', base64String);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbFormData,
    });
    
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || "Upload to ImgBB failed");
    }
    
    const photoUrl = data.data.url;
    const result = await sql`INSERT INTO portfolio (photo_url, description) VALUES (${photoUrl}, ${description || ''}) RETURNING id`;
    return NextResponse.json({ ok: true, id: result.rows[0].id, url: photoUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    
    // In Vercel Blob we might want to delete the file here too, but for simplicity we just remove from DB
    await sql`DELETE FROM portfolio WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

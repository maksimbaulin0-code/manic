import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photo = formData.get('photo') as File;
    
    const targetFile = file || photo;

    if (!targetFile) {
      return NextResponse.json({ error: "file or photo required" }, { status: 400 });
    }

    const blob = await put(targetFile.name, targetFile, {
      access: 'public',
    });

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

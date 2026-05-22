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

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "IMGBB_API_KEY is not set" }, { status: 500 });

    const arrayBuffer = await targetFile.arrayBuffer();
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

    return NextResponse.json({ ok: true, url: data.data.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

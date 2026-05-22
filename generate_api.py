import os

API_DIR = "src/app/api"

routes = {
    "setup/route.ts": """import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT, icon TEXT, sort_order INTEGER DEFAULT 0)`;
    await sql`CREATE TABLE IF NOT EXISTS slots (id SERIAL PRIMARY KEY, date TEXT, time TEXT, status TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS services (id SERIAL PRIMARY KEY, name TEXT, price INTEGER, category_id INTEGER REFERENCES categories(id))`;
    await sql`CREATE TABLE IF NOT EXISTS portfolio (id SERIAL PRIMARY KEY, photo_url TEXT, description TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS reviews (id SERIAL PRIMARY KEY, user_name TEXT, text TEXT, rating INTEGER)`;
    await sql`CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, user_id TEXT, user_name TEXT, service_id INTEGER, slot_id INTEGER, comment TEXT, photo_wish TEXT)`;
    
    // Seed categories
    const catCount = await sql`SELECT COUNT(*) FROM categories`;
    if (parseInt(catCount.rows[0].count) === 0) {
      await sql`INSERT INTO categories (name, icon, sort_order) VALUES ('Наращивание', '━', 1), ('Когти', '◇', 2), ('Покрытие', '○', 3)`;
    }
    
    return NextResponse.json({ ok: true, message: "Database initialized" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",

    "categories/route.ts": """import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM categories ORDER BY sort_order, id`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, icon } = data;
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const result = await sql`INSERT INTO categories (name, icon) VALUES (${name}, ${icon || ''}) RETURNING id`;
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
    await sql`DELETE FROM services WHERE category_id=${id}`;
    await sql`DELETE FROM categories WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",

    "services/route.ts": """import { sql } from '@vercel/postgres';
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
""",

    "slots/route.ts": """import { sql } from '@vercel/postgres';
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
""",

    "all-slots/route.ts": """import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM slots ORDER BY date, time`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",

    "bookings/route.ts": """import { sql } from '@vercel/postgres';
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
""",

    "booking/route.ts": """import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { service_id, slot_id, user_id, user_name, comment, photo_wish } = data;
    
    if (!service_id || !slot_id) {
      return NextResponse.json({ error: "service_id and slot_id required" }, { status: 400 });
    }

    await sql`UPDATE slots SET status='booked' WHERE id=${slot_id}`;
    const result = await sql`
      INSERT INTO bookings (user_id, user_name, service_id, slot_id, comment, photo_wish)
      VALUES (${String(user_id)}, ${user_name || 'Client'}, ${service_id}, ${slot_id}, ${comment || ''}, ${photo_wish || ''})
      RETURNING id
    `;
    
    // Notify admin via Telegram API
    const botToken = process.env.BOT_TOKEN;
    const adminId = process.env.ADMIN_ID;
    
    if (botToken && adminId) {
      const slotData = await sql`SELECT date, time FROM slots WHERE id=${slot_id}`;
      const svcData = await sql`SELECT name, price FROM services WHERE id=${service_id}`;
      
      let adminText = `🔔 **НОВАЯ ЗАПИСЬ!**\\n\\n👤 ${user_name || 'Client'}\\n`;
      if (svcData.rows.length > 0) {
        adminText += `💅 ${svcData.rows[0].name} — ${svcData.rows[0].price}₽\\n`;
      }
      if (slotData.rows.length > 0) {
        adminText += `🕒 ${slotData.rows[0].date} ${slotData.rows[0].time}\\n`;
      }
      if (comment) adminText += `💬 ${comment}\\n`;
      if (photo_wish) adminText += `📸 Фото-референс прикреплен\\n`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminId,
            text: adminText,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error("Telegram notify failed", e);
      }
    }

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",

    "portfolio/route.ts": """import { sql } from '@vercel/postgres';
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
    const photoUrl = formData.get('photoUrl') as string;
    const description = formData.get('description') as string;
    
    if (!photoUrl) return NextResponse.json({ error: "photoUrl required" }, { status: 400 });

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
""",

    "upload/route.ts": """import { put } from '@vercel/blob';
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
""",

    "update-price/route.ts": """import { sql } from '@vercel/postgres';
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
"""
}

for route_path, content in routes.items():
    full_path = os.path.join(API_DIR, route_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
    print(f"Generated {full_path}")

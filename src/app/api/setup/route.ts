import { sql } from '@vercel/postgres';
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

import { sql } from '@vercel/postgres';
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
      
      let adminText = `🔔 **НОВАЯ ЗАПИСЬ!**\n\n👤 ${user_name || 'Client'}\n`;
      if (svcData.rows.length > 0) {
        adminText += `💅 ${svcData.rows[0].name} — ${svcData.rows[0].price}₽\n`;
      }
      if (slotData.rows.length > 0) {
        adminText += `🕒 ${slotData.rows[0].date} ${slotData.rows[0].time}\n`;
      }
      if (comment) adminText += `💬 ${comment}\n`;
      if (photo_wish) adminText += `📸 Фото-референс прикреплен\n`;

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

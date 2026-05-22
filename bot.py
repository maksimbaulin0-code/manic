import asyncio
import sqlite3
import logging
import json
import os
import uuid
from pathlib import Path
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, FSInputFile
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiohttp import web, MultipartReader
from aiohttp.web import middleware

API_TOKEN = os.getenv('BOT_TOKEN', '8766910397:AAE_yXBo_5BWZntzg4L-1LynBamG3Xx-8WM')
ADMIN_ID = 784237794
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://maksimbaulin0-code.github.io/renerie-ciel').rstrip('/')

# Глобальный URL для WebApp (можно обновить через /seturl)
CURRENT_WEBAPP_URL = WEBAPP_URL

def set_webapp_url(url: str):
    global CURRENT_WEBAPP_URL
    CURRENT_WEBAPP_URL = url.rstrip('/')

def detect_ngrok_url():
    """Auto-detect ngrok URL from local API"""
    global CURRENT_WEBAPP_URL
    try:
        import urllib.request, json
        ngrok_data = json.load(urllib.request.urlopen('http://127.0.0.1:4040/api/tunnels', timeout=2))
        for t in ngrok_data.get('tunnels', []):
            if 'https' in t.get('public_url', ''):
                CURRENT_WEBAPP_URL = t['public_url'].rstrip('/')
                logging.info(f"Auto-detected ngrok URL: {CURRENT_WEBAPP_URL}")
                return CURRENT_WEBAPP_URL
    except Exception:
        pass
    return None

# Попытка автоопределения при импорте
detect_ngrok_url()

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)
bot = Bot(token=API_TOKEN)
dp = Dispatcher(storage=MemoryStorage())


class AddSlot(StatesGroup):
    waiting_for_date = State()
    waiting_for_time = State()


# --- БАЗА ДАННЫХ ---
def get_db():
    conn = sqlite3.connect('salon.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = sqlite3.connect('salon.db')
    cur = conn.cursor()
    
    cur.execute('''CREATE TABLE IF NOT EXISTS categories
                   (id INTEGER PRIMARY KEY, name TEXT, icon TEXT, sort_order INTEGER DEFAULT 0)''')
    
    cur.execute('''CREATE TABLE IF NOT EXISTS slots
                   (id INTEGER PRIMARY KEY, date TEXT, time TEXT, status TEXT)''')
    
    cur.execute('''CREATE TABLE IF NOT EXISTS services
                   (id INTEGER PRIMARY KEY, name TEXT, price INTEGER, category_id INTEGER, 
                    FOREIGN KEY (category_id) REFERENCES categories(id))''')
    
    cur.execute('''CREATE TABLE IF NOT EXISTS portfolio
                   (id INTEGER PRIMARY KEY, photo_url TEXT, description TEXT)''')
    
    cur.execute('''CREATE TABLE IF NOT EXISTS reviews
                   (id INTEGER PRIMARY KEY, user_name TEXT, text TEXT, rating INTEGER)''')
    
    cur.execute('''CREATE TABLE IF NOT EXISTS bookings
                   (id INTEGER PRIMARY KEY, user_id TEXT, user_name TEXT, service_id INTEGER, 
                    slot_id INTEGER, comment TEXT, photo_wish TEXT)''')
    
    # Seed default categories
    cur.execute("SELECT COUNT(*) FROM categories")
    if cur.fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)",
            [("Наращивание", "━", 1), ("Когти", "◇", 2), ("Покрытие", "○", 3)]
        )
    
    # Migrate old services (category TEXT → category_id INTEGER)
    try:
        cur.execute("PRAGMA table_info(services)")
        cols = [col[1] for col in cur.fetchall()]
        if 'category' in cols and 'category_id' not in cols:
            # Backup old data
            cur.execute("SELECT id, name, price, category FROM services")
            old_services = cur.fetchall()
            # Drop and recreate
            cur.execute("DROP TABLE services")
            cur.execute('''CREATE TABLE services
                           (id INTEGER PRIMARY KEY, name TEXT, price INTEGER, category_id INTEGER,
                            FOREIGN KEY (category_id) REFERENCES categories(id))''')
            # Re-insert with category_id mapping
            cat_map = {}
            cur.execute("SELECT id, name FROM categories")
            for row in cur.fetchall():
                cat_map[row[1].lower()] = row[0]
            for svc in old_services:
                cat_id = cat_map.get(svc[3].lower(), 1)
                cur.execute("INSERT INTO services (name, price, category_id) VALUES (?, ?, ?)",
                          (svc[1], svc[2], cat_id))
    except Exception as e:
        logging.warning(f"Migration skipped: {e}")
    
    # Seed default services if empty
    cur.execute("SELECT COUNT(*) FROM services")
    if cur.fetchone()[0] == 0:
        cur.execute("SELECT id FROM categories WHERE name='Наращивание'")
        ext_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM categories WHERE name='Когти'")
        claws_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM categories WHERE name='Покрытие'")
        cov_id = cur.fetchone()[0]
        services_data = [
            ("Наращивание длина 1-3", 4000, ext_id),
            ("Наращивание длина 4-5", 4500, ext_id),
            ("Наращивание длина 6-8", 5000, ext_id),
            ("Наращивание длина 9-11", 5500, ext_id),
            ("Когти (к цене наращивания)", 1000, claws_id),
            ("Покрытие Когти", 4000, claws_id),
            ("Покрытие на свои (до 2 длины)", 3500, cov_id),
            ("Френч (+ к прайсу)", 500, cov_id),
        ]
        cur.executemany("INSERT INTO services (name, price, category_id) VALUES (?, ?, ?)", services_data)
    
    conn.commit()
    conn.close()


# --- КЛАВИАТУРЫ ---
def web_app_keyboard():
    kb = InlineKeyboardBuilder()
    kb.button(text="✨ Открыть Alimsa Nail", web_app=WebAppInfo(url=CURRENT_WEBAPP_URL))
    kb.adjust(1)
    return kb.as_markup()


def admin_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="➕ Добавить слот", callback_data="add_slot")
    kb.button(text="📋 Все записи", callback_data="admin_bookings")
    kb.adjust(1)
    return kb.as_markup()


# --- ОБРАБОТЧИКИ ---
@dp.message(Command("start"))
async def start(message: types.Message):
    kb = InlineKeyboardBuilder()
    kb.button(text="✨ Открыть Alimsa Nail", web_app=WebAppInfo(url=CURRENT_WEBAPP_URL))
    kb.adjust(1)
    await message.answer(
        "**Alimsa Nail**\n\nЭстетика в каждой детали\n\n"
        "Нажми кнопку ниже, чтобы открыть приложение.",
        reply_markup=kb.as_markup(), parse_mode="Markdown"
    )


@dp.message(Command("webapp"))
async def set_webapp_menu(message: types.Message):
    from aiogram.types import MenuButtonWebApp
    await bot.set_chat_menu_button(
        chat_id=message.chat.id,
        menu_button=MenuButtonWebApp(text="Alimsa Nail", web_app=WebAppInfo(url=CURRENT_WEBAPP_URL))
    )
    await message.answer(
        f"✅ Меню-кнопка установлен!\n\n"
        f"Текущий URL: `{CURRENT_WEBAPP_URL}`\n\n"
        f"Нажми **Alimsa Nail** в меню слева.",
        parse_mode="Markdown"
    )


@dp.message(Command("url"))
async def cmd_url(message: types.Message):
    detect_ngrok_url()
    is_ngrok = "ngrok" in CURRENT_WEBAPP_URL
    status = "✅ ngrok" if is_ngrok else "⚠️ GitHub Pages (API не будет работать)"
    await message.answer(
        f"**Текущий URL:**\n\n"
        f"`{CURRENT_WEBAPP_URL}`\n\n"
        f"{status}\n\n"
        f"Если это GitHub Pages — запустите ngrok и отправьте:\n"
        f"`/seturl https://xxx.ngrok-free.app`",
        parse_mode="Markdown"
    )


@dp.message(Command("link"))
async def send_link(message: types.Message):
    detect_ngrok_url()
    kb = InlineKeyboardBuilder()
    kb.button(text="🌐 Открыть сайт", url=CURRENT_WEBAPP_URL)
    kb.adjust(1)
    await message.answer(
        f"`{CURRENT_WEBAPP_URL}`",
        reply_markup=kb.as_markup(), parse_mode="Markdown"
    )


@dp.message(Command("seturl"))
async def cmd_seturl(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        return
    args = message.text.replace("/seturl", "").strip()
    if not args:
        await message.answer(
            f"Использование: `/seturl https://xxx.ngrok-free.app`\n\n"
            f"Текущий: `{CURRENT_WEBAPP_URL}`",
            parse_mode="Markdown"
        )
        return
    set_webapp_url(args)
    await message.answer(
        f"✅ URL обновлён!\n\n"
        f"Новый URL: `{CURRENT_WEBAPP_URL}`\n\n"
        f"Отправь `/start` чтобы получить обновлённую кнопку.",
        parse_mode="Markdown"
    )


@dp.message(Command("admin"))
async def admin_panel(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        return
    await message.answer("🛠 **Панель мастера**", reply_markup=admin_menu(), parse_mode="Markdown")


# --- Добавление слота ---
@dp.callback_query(F.data == "add_slot")
async def add_slot_start(callback: types.CallbackQuery, state: FSMContext):
    if callback.from_user.id != ADMIN_ID: return
    await callback.message.answer("📅 Введите дату (например: **15 мая**):", parse_mode="Markdown")
    await state.set_state(AddSlot.waiting_for_date)
    await callback.answer()


@dp.message(AddSlot.waiting_for_date)
async def add_slot_time(message: types.Message, state: FSMContext):
    await state.update_data(date=message.text)
    await message.answer("🕒 Введите время (например: **12:00**):", parse_mode="Markdown")
    await state.set_state(AddSlot.waiting_for_time)


@dp.message(AddSlot.waiting_for_time)
async def add_slot_finish(message: types.Message, state: FSMContext):
    data = await state.get_data()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO slots (date, time, status) VALUES (?, ?, 'free')", (data['date'], message.text))
    conn.commit(); conn.close()
    await message.answer(f"✅ Слот **{data['date']} в {message.text}** добавлен!", parse_mode="Markdown", reply_markup=admin_menu())
    await state.clear()


# --- Просмотр записей (админ) ---
@dp.callback_query(F.data == "admin_bookings")
async def admin_view_bookings(callback: types.CallbackQuery):
    if callback.from_user.id != ADMIN_ID: return
    conn = get_db(); cur = conn.cursor()
    cur.execute("""SELECT b.id, b.user_name, b.comment, b.photo_wish,
                          s.name as service_name, s.price,
                          sl.date, sl.time
                   FROM bookings b
                   LEFT JOIN services s ON b.service_id = s.id
                   LEFT JOIN slots sl ON b.slot_id = sl.id
                   ORDER BY b.id DESC LIMIT 20""")
    bookings = cur.fetchall(); conn.close()
    if not bookings:
        await callback.answer("Записей нет", show_alert=True); return
    text = "📋 **Последние записи:**\n\n"
    for b in bookings:
        text += f"👤 {b[1]}\n💅 {b[4]} — {b[5]}₽\n📅 {b[6]} в {b[7]}\n"
        if b[2]: text += f"💬 Пожелание: {b[2]}\n"
        if b[3]: text += f"📸 Фото-референс прикреплён\n"
        text += "\n"
    await callback.message.answer(text, parse_mode="Markdown")
    await callback.answer()


# --- WebApp Data handler ---
@dp.message(F.web_app_data)
async def web_app_data_handler(message: types.Message):
    data = json.loads(message.web_app_data.data)
    action = data.get("action")
    
    if action == "book":
        conn = get_db(); cur = conn.cursor()
        cur.execute("UPDATE slots SET status='booked' WHERE id=?", (data["slot_id"],))
        cur.execute("""INSERT INTO bookings (user_id, user_name, service_id, slot_id, comment, photo_wish)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (str(message.from_user.id), message.from_user.full_name,
                     data["service_id"], data["slot_id"], data.get("comment", ""), data.get("photo_wish", "")))
        cur.execute("SELECT date, time FROM slots WHERE id=?", (data["slot_id"],))
        slot = cur.fetchone()
        cur.execute("SELECT name, price FROM services WHERE id=?", (data["service_id"],))
        svc = cur.fetchone()
        conn.commit(); conn.close()
        
        await message.answer(
            f"✅ **Запись оформлена!**\n\n💅 {svc[0]}\n💰 {svc[1]}₽\n📅 {slot[0]} в {slot[1]}\n"
            + (f"💬 {data.get('comment', '')}\n" if data.get('comment') else "")
            + (f"📸 Фото-референс\n" if data.get('photo_wish') else "") + "\nЖду тебя! ❤️",
            parse_mode="Markdown"
        )
        # Admin notification
        admin_text = (f"🔔 **НОВАЯ ЗАПИСЬ!**\n\n👤 {message.from_user.full_name}\n"
                      f"💅 {svc[0]} — {svc[1]}₽\n🕒 {slot[0]} {slot[1]}\n")
        if data.get('comment'): admin_text += f"💬 {data.get('comment')}\n"
        photo_wish = data.get('photo_wish', '')
        try:
            await bot.send_message(ADMIN_ID, admin_text, parse_mode="Markdown")
            if photo_wish and photo_wish.startswith('/uploads/'):
                fp = UPLOAD_DIR / Path(photo_wish).name
                if fp.exists():
                    await bot.send_photo(ADMIN_ID, FSInputFile(str(fp)), caption="📸 Фото-референс")
        except Exception as e:
            logging.error(f"Admin notify failed: {e}")


# --- API ENDPOINTS ---
@middleware
async def cors_middleware(request, handler):
    if request.method == 'OPTIONS':
        resp = web.Response(status=204)
    else:
        resp = await handler(request)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, DELETE, PUT'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return resp


async def api_categories(request):
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM categories ORDER BY sort_order, id")
    rows = [dict(row) for row in cur.fetchall()]; conn.close()
    return web.json_response(rows)


async def api_services(request):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""SELECT s.*, c.name as category_name, c.icon as category_icon
                   FROM services s
                   LEFT JOIN categories c ON s.category_id = c.id
                   ORDER BY c.sort_order, s.id""")
    rows = [dict(row) for row in cur.fetchall()]; conn.close()
    return web.json_response(rows)


async def api_slots(request):
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM slots WHERE status='free'")
    rows = [dict(row) for row in cur.fetchall()]; conn.close()
    return web.json_response(rows)


async def api_all_slots(request):
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM slots ORDER BY date, time")
    rows = [dict(row) for row in cur.fetchall()]; conn.close()
    return web.json_response(rows)


async def api_portfolio(request):
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM portfolio ORDER BY id DESC")
    rows = [dict(row) for row in cur.fetchall()]; conn.close()
    return web.json_response(rows)


async def api_bookings(request):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""SELECT b.id, s.name, s.price, sl.date, sl.time, b.comment, b.photo_wish
                   FROM bookings b
                   LEFT JOIN services s ON b.service_id = s.id
                   LEFT JOIN slots sl ON b.slot_id = sl.id
                   ORDER BY b.id DESC""")
    rows = [dict(row) for row in cur.fetchall()]; conn.close()
    return web.json_response(rows)


async def api_add_category(request):
    data = await request.json()
    name = data.get("name", "").strip()
    icon = data.get("icon", "").strip()
    if not name: return web.json_response({"error": "name required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO categories (name, icon) VALUES (?, ?)", (name, icon))
    conn.commit(); cat_id = cur.lastrowid; conn.close()
    return web.json_response({"ok": True, "id": cat_id})


async def api_delete_category(request):
    data = await request.json()
    cat_id = data.get("id")
    if not cat_id: return web.json_response({"error": "id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("DELETE FROM services WHERE category_id=?", (cat_id,))
    cur.execute("DELETE FROM categories WHERE id=?", (cat_id,))
    conn.commit(); conn.close()
    return web.json_response({"ok": True})


async def api_add_service(request):
    data = await request.json()
    name = data.get("name", "").strip()
    price = data.get("price", 0)
    category_id = data.get("category_id")
    if not name or not category_id: return web.json_response({"error": "name and category_id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO services (name, price, category_id) VALUES (?, ?, ?)", (name, price, category_id))
    conn.commit(); svc_id = cur.lastrowid; conn.close()
    return web.json_response({"ok": True, "id": svc_id})


async def api_delete_service(request):
    data = await request.json()
    svc_id = data.get("id")
    if not svc_id: return web.json_response({"error": "id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("DELETE FROM services WHERE id=?", (svc_id,)); conn.commit(); conn.close()
    return web.json_response({"ok": True})


async def api_update_service(request):
    data = await request.json()
    svc_id = data.get("id")
    name = data.get("name", "").strip()
    price = data.get("price")
    if not svc_id: return web.json_response({"error": "id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    if name:
        cur.execute("UPDATE services SET name=? WHERE id=?", (name, svc_id))
    if price is not None:
        cur.execute("UPDATE services SET price=? WHERE id=?", (price, svc_id))
    conn.commit(); conn.close()
    return web.json_response({"ok": True})


async def api_add_slot(request):
    data = await request.json()
    date = data.get("date", "").strip()
    time = data.get("time", "").strip()
    if not date or not time: return web.json_response({"error": "date and time required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO slots (date, time, status) VALUES (?, ?, 'free')", (date, time))
    conn.commit(); slot_id = cur.lastrowid; conn.close()
    return web.json_response({"ok": True, "id": slot_id})


async def api_delete_slot(request):
    data = await request.json()
    slot_id = data.get("id")
    if not slot_id: return web.json_response({"error": "id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("DELETE FROM slots WHERE id=?", (slot_id,)); conn.commit(); conn.close()
    return web.json_response({"ok": True})


async def api_update_price(request):
    data = await request.json()
    service_id = data.get("id")
    new_price = data.get("price")
    if not service_id or not new_price: return web.json_response({"error": "id and price required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("UPDATE services SET price=? WHERE id=?", (new_price, service_id))
    conn.commit(); conn.close()
    return web.json_response({"ok": True})


async def api_booking_create(request):
    data = await request.json()
    service_id = data.get("service_id")
    slot_id = data.get("slot_id")
    user_id = data.get("user_id", "api")
    user_name = data.get("user_name", "API Client")
    comment = data.get("comment", "")
    photo_wish = data.get("photo_wish", "")
    if not service_id or not slot_id: return web.json_response({"error": "service_id and slot_id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("UPDATE slots SET status='booked' WHERE id=?", (slot_id,))
    cur.execute("""INSERT INTO bookings (user_id, user_name, service_id, slot_id, comment, photo_wish)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (str(user_id), user_name, service_id, slot_id, comment, photo_wish))
    cur.execute("SELECT date, time FROM slots WHERE id=?", (slot_id,))
    slot = cur.fetchone()
    cur.execute("SELECT name, price FROM services WHERE id=?", (service_id,))
    svc = cur.fetchone()
    conn.commit(); booking_id = cur.lastrowid; conn.close()
    if slot and svc:
        admin_text = (f"🔔 **НОВАЯ ЗАПИСЬ (API)!**\n\n👤 {user_name}\n"
                      f"💅 {svc[0]} — {svc[1]}₽\n🕒 {slot[0]} {slot[1]}\n")
        if comment: admin_text += f"💬 {comment}\n"
        try:
            await bot.send_message(ADMIN_ID, admin_text, parse_mode="Markdown")
            if photo_wish and photo_wish.startswith('/uploads/'):
                fp = UPLOAD_DIR / Path(photo_wish).name
                if fp.exists():
                    await bot.send_photo(ADMIN_ID, FSInputFile(str(fp)), caption="📸 Фото-референс")
        except Exception as e:
            logging.error(f"API booking notify failed: {e}")
    return web.json_response({"ok": True, "id": booking_id})


# --- PHOTO UPLOAD ---
async def api_upload_photo(request):
    reader = await request.multipart()
    description = ""
    file_data = None
    filename = None
    
    async for part in reader:
        if part.name == "description":
            description = (await part.text()).strip()
        elif part.name == "photo":
            filename = part.filename
            file_data = await part.read()
    
    if not file_data:
        return web.json_response({"error": "photo required"}, status=400)
    
    ext = Path(filename or "upload.jpg").suffix or ".jpg"
    file_id = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / file_id
    file_path.write_bytes(file_data)
    
    # Store relative URL
    photo_url = f"/uploads/{file_id}"
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO portfolio (photo_url, description) VALUES (?, ?)", (photo_url, description))
    conn.commit(); portfolio_id = cur.lastrowid; conn.close()
    
    return web.json_response({"ok": True, "id": portfolio_id, "url": photo_url})


async def api_delete_portfolio(request):
    data = await request.json()
    p_id = data.get("id")
    if not p_id: return web.json_response({"error": "id required"}, status=400)
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT photo_url FROM portfolio WHERE id=?", (p_id,))
    row = cur.fetchone()
    if row:
        # Delete file
        try:
            file_path = UPLOAD_DIR / Path(row[0]).name
            if file_path.exists(): file_path.unlink()
        except Exception as e: logging.warning(f"Failed to delete file: {e}")
    cur.execute("DELETE FROM portfolio WHERE id=?", (p_id,))
    conn.commit(); conn.close()
    return web.json_response({"ok": True})


async def api_upload_file(request):
    reader = await request.multipart()
    file_data = None
    filename = None

    async for part in reader:
        if part.name == "file":
            filename = part.filename
            file_data = await part.read()

    if not file_data:
        return web.json_response({"error": "file required"}, status=400)

    ext = Path(filename or "upload.jpg").suffix or ".jpg"
    file_id = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / file_id
    file_path.write_bytes(file_data)

    return web.json_response({"ok": True, "url": f"/uploads/{file_id}"})


# --- SERVE STATIC FILES ---
async def index_handler(request):
    import os, mimetypes
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'out')
    index_path = os.path.join(frontend_dir, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            return web.Response(text=f.read(), content_type='text/html')
    return web.Response(text="Frontend not built. Run: cd frontend && npm run build", status=404)


async def catchall_handler(request):
    import os, mimetypes
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'out')
    path = request.path.lstrip('/')
    
    # Serve uploads
    if path.startswith('uploads/'):
        upload_path = os.path.join(os.path.dirname(__file__), path)
        if os.path.exists(upload_path) and os.path.isfile(upload_path):
            with open(upload_path, 'rb') as f:
                content = f.read()
            ct, _ = mimetypes.guess_type(upload_path)
            return web.Response(body=content, content_type=ct or 'application/octet-stream')
        return web.Response(status=404)
    
    # Serve frontend files
    file_path = os.path.join(frontend_dir, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        with open(file_path, 'rb') as f:
            content = f.read()
        ct, _ = mimetypes.guess_type(file_path)
        return web.Response(body=content, content_type=ct or 'application/octet-stream')
    
    index_path = os.path.join(frontend_dir, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            return web.Response(text=f.read(), content_type='text/html')
    return web.Response(status=404)


def create_api_app():
    app = web.Application(middlewares=[cors_middleware], client_max_size=10*1024*1024)
    # API routes first — must be before catchall
    app.router.add_routes([
        web.get('/api/categories', api_categories),
        web.get('/api/services', api_services),
        web.get('/api/slots', api_slots),
        web.get('/api/all-slots', api_all_slots),
        web.get('/api/portfolio', api_portfolio),
        web.get('/api/bookings', api_bookings),
        web.post('/api/categories', api_add_category),
        web.delete('/api/categories', api_delete_category),
        web.post('/api/services', api_add_service),
        web.delete('/api/services', api_delete_service),
        web.put('/api/services', api_update_service),
        web.post('/api/slots', api_add_slot),
        web.delete('/api/slots', api_delete_slot),
        web.post('/api/update-price', api_update_price),
        web.post('/api/booking', api_booking_create),
        web.post('/api/portfolio', api_upload_photo),
        web.delete('/api/portfolio', api_delete_portfolio),
        web.post('/api/upload', api_upload_file),
    ])
    # Static/catchall routes LAST so they don't shadow API
    app.router.add_get('/', index_handler)
    app.router.add_get('/{path:.*}', catchall_handler)
    return app


# --- ЗАПУСК ---
async def main():
    # Попытка обновить URL из ngrok при запуске
    detect_ngrok_url()
    init_db()
    app = create_api_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()
    logging.info("API server started on port 8080")
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот выключен")

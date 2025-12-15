# 🚂 คู่มือ Deploy บน Railway (ฟรี $5/เดือน)

Railway เป็น platform ที่ดีสำหรับ deploy backend ฟรี $5 credit/เดือน

## 📋 ขั้นตอนการ Deploy

### 1. สร้าง Account

1. ไปที่ https://railway.app
2. คลิก **Login** → **Login with GitHub**
3. Authorize Railway

### 2. สร้าง Project

1. คลิก **New Project**
2. เลือก **Deploy from GitHub repo**
3. เลือก repository ของคุณ
4. Railway จะ auto-detect และสร้าง project ให้

### 3. ตั้งค่า Backend Service

1. Railway จะ auto-detect `backend` folder
2. ถ้าไม่ auto-detect:
   - คลิก **+ New** → **GitHub Repo**
   - เลือก repository
   - ตั้งค่า **Root Directory**: `backend`

### 4. ตั้งค่า Database (Supabase - ฟรี)

**Option A: ใช้ Supabase (แนะนำ)**

1. ไปที่ https://supabase.com
2. สร้าง project ใหม่
3. ไปที่ **Settings** → **Database** → **Connection string**
4. คัดลอก **Connection string** (URI format)

**Option B: ใช้ Railway PostgreSQL**

1. ใน Railway project → **+ New** → **Database** → **Add PostgreSQL**
2. Railway จะสร้าง database ให้
3. คัดลอก **DATABASE_URL** จาก **Variables** tab

### 5. ตั้งค่า Environment Variables

ใน Railway project → **Variables** tab → เพิ่ม:

```bash
# Database (จาก Supabase หรือ Railway)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# JWT Secrets (สร้างเอง)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe (ถ้ามี)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs (จะอัพเดทหลัง deploy frontend)
FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# Rate Limiting
AI_RATE_LIMIT_TTL=60
AI_RATE_LIMIT_MAX=10

# Credits
FREE_PLAN_SEO_CREDITS=0
FREE_PLAN_REEL_CREDITS=0
BASIC_PLAN_SEO_CREDITS=50
BASIC_PLAN_REEL_CREDITS=100
PRO_PLAN_SEO_CREDITS=200
PRO_PLAN_REEL_CREDITS=500
TRYOUT_SEO_CREDITS=3
TRYOUT_REEL_CREDITS=5
TRYOUT_DURATION_DAYS=7
```

### 6. ตั้งค่า Build และ Start Commands

Railway จะ auto-detect แต่ถ้าไม่:

1. ไปที่ **Settings** → **Service**
2. ตั้งค่า:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

### 7. Deploy

1. Railway จะ auto-deploy เมื่อ push code
2. หรือคลิก **Deploy** → **Redeploy**
3. รอให้ deploy เสร็จ (ประมาณ 3-5 นาที)

### 8. Run Database Migrations

1. ไปที่ **Deployments** tab
2. คลิกที่ deployment ล่าสุด
3. คลิก **View Logs**
4. คลิก **Shell** (หรือ **Open Shell**)
5. รันคำสั่ง:
   ```bash
   npm run prisma:generate
   npm run prisma:deploy
   ```

### 9. ตั้งค่า Domain

1. ไปที่ **Settings** → **Networking**
2. คลิก **Generate Domain**
3. คัดลอก URL (เช่น `https://your-backend.up.railway.app`)
4. ใช้ URL นี้เป็น `NEXT_PUBLIC_API_URL` ใน frontend

### 10. Update Frontend URL

1. กลับไปที่ **Variables** tab
2. แก้ไข `FRONTEND_URL` เป็น URL ของ frontend (Vercel)
3. Railway จะ auto-redeploy

---

## 🔧 ตั้งค่า Auto-Deploy

1. ไปที่ **Settings** → **Service**
2. เปิด **Auto-Deploy**
3. เลือก branch (ปกติ `main` หรือ `master`)
4. เมื่อ push code ไป GitHub → Railway จะ auto-deploy

---

## 📊 Monitor Usage

1. ไปที่ **Settings** → **Usage**
2. ดู credit ที่ใช้ไป
3. $5 credit/เดือนพอใช้สำหรับ small app

---

## 🐛 Troubleshooting

### Build Failed:
- ตรวจสอบ logs ใน **Deployments** tab
- ตรวจสอบว่า `package.json` มี scripts ที่ถูกต้อง
- ตรวจสอบ environment variables

### Database Connection Failed:

**Error: `Can't reach database server at postgres.railway.internal:5432`**

ปัญหานี้เกิดจากการใช้ Railway internal hostname ซึ่งอาจไม่สามารถเข้าถึงได้

**วิธีแก้ไข:**

1. **ถ้าใช้ Railway PostgreSQL:**
   - ไปที่ Railway project → **Variables** tab
   - คัดลอก `DATABASE_URL` ที่ Railway สร้างให้ (ไม่ใช่ internal hostname)
   - ควรมีรูปแบบ: `postgresql://postgres:[password]@[host].railway.app:[port]/railway`
   - หรือ `postgresql://postgres:[password]@[host]:[port]/railway`

2. **ถ้าใช้ Supabase:**
   - ไปที่ Supabase project → **Settings** → **Database**
   - คัดลอก **Connection string** (URI format)
   - ควรมีรูปแบบ: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require`
   - **สำคัญ:** ต้องมี `?sslmode=require` สำหรับ Supabase

3. **ตรวจสอบ DATABASE_URL:**
   - ตรวจสอบว่าไม่มี `railway.internal` ใน hostname
   - ตรวจสอบว่า format ถูกต้อง: `postgresql://user:password@host:port/database`
   - สำหรับ Supabase ต้องมี `?sslmode=require` หรือ `?sslmode=prefer`

4. **ตรวจสอบ logs:**
   - ดู logs ใน Railway → **Deployments** tab
   - ดูว่า DATABASE_URL ที่ใช้เป็นอะไร (จะแสดง hostname โดยไม่แสดง password)

### Application Crashed:
- ตรวจสอบ logs
- ตรวจสอบ environment variables
- ตรวจสอบว่า migrations run แล้ว

---

## 💡 Tips

1. **ใช้ Supabase สำหรับ Database** - ฟรีและดี
2. **Monitor Usage** - ตรวจสอบ credit ที่ใช้ไป
3. **ตั้งค่า Auto-Deploy** - สะดวกมาก
4. **ใช้ Environment Variables** - อย่า hardcode
5. **Backup Database** - สำคัญมาก!

---

**เสร็จแล้ว! 🎉**


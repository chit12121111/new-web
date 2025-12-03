# 🆓 คู่มือ Deploy ฟรี (Free Hosting)

คู่มือนี้จะแนะนำวิธี deploy application ฟรีบน platforms ที่มี free tier

## 📋 แพลตฟอร์มที่แนะนำ (ฟรี)

### Frontend (Next.js)
- ✅ **Vercel** (แนะนำ) - ฟรี ไม่จำกัด
- ✅ **Netlify** - ฟรี 100GB bandwidth/เดือน
- ✅ **Cloudflare Pages** - ฟรี ไม่จำกัด

### Backend (NestJS)
- ✅ **Railway** - $5 credit/เดือน (พอใช้ได้)
- ✅ **Render** - ฟรี แต่ sleep หลัง 15 นาทีไม่ใช้งาน
- ✅ **Fly.io** - ฟรี 3 shared-cpu VMs
- ✅ **Cyclic** - ฟรี ไม่จำกัด

### Database (PostgreSQL)
- ✅ **Supabase** (แนะนำ) - ฟรี 500MB database
- ✅ **Neon** - ฟรี 0.5GB storage
- ✅ **Railway** - รวมกับ backend
- ✅ **Render** - ฟรี 90 วัน

---

## 🚀 วิธีที่ 1: Vercel (Frontend) + Railway (Backend) + Supabase (Database)

### ขั้นตอนที่ 1: Deploy Database (Supabase) - ฟรี

1. ไปที่ https://supabase.com
2. สร้าง account (ฟรี)
3. New Project → Create new project
4. ตั้งค่า:
   - **Name**: ecommerce-db
   - **Database Password**: ตั้งรหัสผ่านที่ปลอดภัย (บันทึกไว้!)
   - **Region**: เลือกใกล้ที่สุด
5. รอให้ project สร้างเสร็จ (ประมาณ 2 นาที)
6. ไปที่ **Settings** → **Database** → **Connection string**
7. คัดลอก **Connection string** (URI format)
   - ตัวอย่าง: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### ขั้นตอนที่ 2: Deploy Backend (Railway) - ฟรี $5/เดือน

1. ไปที่ https://railway.app
2. Login with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. เลือก repository ของคุณ
5. เลือก **backend** folder
6. Railway จะ auto-detect และ build ให้
7. ไปที่ **Variables** tab → เพิ่ม Environment Variables:

```bash
# Database (จาก Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# JWT (สร้างเอง - ใช้ openssl หรือ online generator)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe (ถ้ามี)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs (จะได้ URL หลัง deploy)
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

8. ไปที่ **Settings** → **Generate Domain** → คัดลอก URL (เช่น `https://your-backend.up.railway.app`)
9. รอให้ deploy เสร็จ
10. ไปที่ **Deployments** → คลิกที่ deployment ล่าสุด → **View Logs**
11. ตรวจสอบว่า build สำเร็จ
12. Run migrations:
    - ไปที่ **Deployments** → คลิกที่ deployment → **Shell**
    - รันคำสั่ง:
    ```bash
    npm run prisma:generate
    npm run prisma:deploy
    ```

### ขั้นตอนที่ 3: Deploy Frontend (Vercel) - ฟรี

1. ไปที่ https://vercel.com
2. Login with GitHub
3. **Add New Project** → Import Git Repository
4. เลือก repository ของคุณ
5. ตั้งค่า:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detect)
   - **Output Directory**: `.next` (auto-detect)
6. **Environment Variables** → เพิ่ม:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

7. **Deploy**
8. รอให้ deploy เสร็จ (ประมาณ 2-3 นาที)
9. คัดลอก URL (เช่น `https://your-app.vercel.app`)

### ขั้นตอนที่ 4: Update URLs

1. กลับไปที่ **Railway** (Backend)
2. **Variables** → แก้ไข:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. **Redeploy** (Railway จะ auto-redeploy)

---

## 🚀 วิธีที่ 2: Render (Backend + Database) + Vercel (Frontend)

### ขั้นตอนที่ 1: Deploy Database (Render) - ฟรี 90 วัน

1. ไปที่ https://render.com
2. Login with GitHub
3. **New** → **PostgreSQL**
4. ตั้งค่า:
   - **Name**: ecommerce-db
   - **Database**: ecommerce_db
   - **User**: ecommerce_user
   - **Region**: เลือกใกล้ที่สุด
   - **PostgreSQL Version**: 15
5. **Create Database**
6. รอให้สร้างเสร็จ (ประมาณ 2-3 นาที)
7. ไปที่ **Connections** → คัดลอก **Internal Database URL**
   - ตัวอย่าง: `postgresql://ecommerce_user:password@dpg-xxx.oregon-postgres.render.com/ecommerce_db`

### ขั้นตอนที่ 2: Deploy Backend (Render) - ฟรี (แต่ sleep)

1. **New** → **Web Service**
2. Connect GitHub repository
3. ตั้งค่า:
   - **Name**: ecommerce-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
4. **Advanced** → **Add Environment Variable**:

```bash
DATABASE_URL=postgresql://ecommerce_user:password@dpg-xxx.oregon-postgres.render.com/ecommerce_db
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://ecommerce-backend.onrender.com
# ... (เพิ่มตัวอื่นๆ ตามวิธีที่ 1)
```

5. **Create Web Service**
6. รอให้ deploy เสร็จ (ประมาณ 5-10 นาที)
7. **Shell** → Run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:deploy
   ```

**หมายเหตุ**: Render free tier จะ sleep หลัง 15 นาทีไม่ใช้งาน (wake up ช้า ~30 วินาที)

### ขั้นตอนที่ 3: Deploy Frontend (Vercel)

ทำตาม **วิธีที่ 1 - ขั้นตอนที่ 3**

---

## 🚀 วิธีที่ 3: Fly.io (Backend) + Vercel (Frontend) + Neon (Database)

### ขั้นตอนที่ 1: Deploy Database (Neon) - ฟรี

1. ไปที่ https://neon.tech
2. Login with GitHub
3. **Create Project**
4. ตั้งค่า:
   - **Name**: ecommerce-db
   - **Region**: เลือกใกล้ที่สุด
   - **PostgreSQL Version**: 15
5. **Create Project**
6. ไปที่ **Connection Details** → คัดลอก **Connection string**

### ขั้นตอนที่ 2: Deploy Backend (Fly.io) - ฟรี

1. ไปที่ https://fly.io
2. Login with GitHub
3. ติดตั้ง Fly CLI:
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # หรือใช้ scoop
   scoop install flyctl
   ```
4. Login:
   ```bash
   fly auth login
   ```
5. สร้างไฟล์ `backend/fly.toml`:
   ```toml
   app = "ecommerce-backend"
   primary_region = "sin"  # Singapore (เลือกตามต้องการ)

   [build]

   [env]
     PORT = "4000"
     NODE_ENV = "production"

   [[services]]
     internal_port = 4000
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80
       force_https = true

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```
6. Deploy:
   ```bash
   cd backend
   fly launch
   ```
7. ตั้งค่า Environment Variables:
   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set JWT_SECRET="your-secret"
   fly secrets set JWT_REFRESH_SECRET="your-refresh-secret"
   # ... (เพิ่มตัวอื่นๆ)
   ```
8. Run migrations:
   ```bash
   fly ssh console
   npm run prisma:deploy
   ```

### ขั้นตอนที่ 3: Deploy Frontend (Vercel)

ทำตาม **วิธีที่ 1 - ขั้นตอนที่ 3**

---

## 🔧 ตั้งค่า Prisma สำหรับ Production

### 1. ปรับ `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // เพิ่ม connection pooling สำหรับ production
  directUrl = env("DIRECT_URL") // สำหรับ migrations (ถ้ามี)
}
```

### 2. ใช้ Connection Pooling (แนะนำ):

สำหรับ Supabase/Neon ใช้ connection pooling URL:
- Supabase: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:6543/postgres?pgbouncer=true`
- Neon: ใช้ pooled connection string จาก dashboard

---

## 📝 Checklist สำหรับ Free Deploy

### Database:
- [ ] สร้าง database (Supabase/Neon/Render)
- [ ] คัดลอก connection string
- [ ] ทดสอบ connection

### Backend:
- [ ] Deploy backend (Railway/Render/Fly.io)
- [ ] ตั้งค่า environment variables
- [ ] Run migrations (`npm run prisma:deploy`)
- [ ] ทดสอบ API endpoint (`/api/health`)

### Frontend:
- [ ] Deploy frontend (Vercel)
- [ ] ตั้งค่า `NEXT_PUBLIC_API_URL`
- [ ] ทดสอบ frontend

### Post-Deploy:
- [ ] Update `FRONTEND_URL` ใน backend
- [ ] ทดสอบ login/register
- [ ] ทดสอบ API calls
- [ ] ตั้งค่า custom domain (ถ้าต้องการ)

---

## 🆓 ข้อจำกัดของ Free Tier

### Vercel:
- ✅ ฟรี ไม่จำกัด
- ⚠️ จำกัด 100 builds/วัน (พอใช้)
- ⚠️ จำกัด bandwidth (แต่พอใช้)

### Railway:
- ✅ $5 credit/เดือน (พอใช้ได้)
- ⚠️ หมด credit ต้องเติมเงิน

### Render:
- ✅ ฟรี
- ⚠️ Sleep หลัง 15 นาทีไม่ใช้งาน
- ⚠️ Wake up ช้า (~30 วินาที)

### Supabase:
- ✅ ฟรี 500MB database
- ⚠️ จำกัด 2GB bandwidth/เดือน
- ⚠️ จำกัด 500MB database storage

### Neon:
- ✅ ฟรี 0.5GB storage
- ⚠️ จำกัด 0.5GB storage

---

## 💡 Tips สำหรับ Free Tier

1. **ใช้ Vercel สำหรับ Frontend** - ฟรีและดีที่สุด
2. **ใช้ Railway สำหรับ Backend** - $5 credit/เดือนพอใช้
3. **ใช้ Supabase สำหรับ Database** - ฟรีและดี
4. **ตั้งค่า Auto-deploy** - เมื่อ push code จะ auto-deploy
5. **ใช้ Environment Variables** - อย่า hardcode secrets
6. **Monitor Usage** - ตรวจสอบ usage ใน dashboard

---

## 🔄 Update Application

### Vercel:
- Auto-deploy เมื่อ push ไป GitHub
- หรือ manual deploy จาก dashboard

### Railway:
- Auto-deploy เมื่อ push ไป GitHub
- หรือ manual deploy จาก dashboard

### Render:
- Auto-deploy เมื่อ push ไป GitHub
- หรือ manual deploy จาก dashboard

---

## 🐛 Troubleshooting

### Backend ไม่เชื่อมต่อ Database:
- ตรวจสอบ `DATABASE_URL`
- ตรวจสอบ firewall rules (บาง platform ต้อง allow IP)
- ใช้ connection pooling URL

### Frontend ไม่เชื่อมต่อ Backend:
- ตรวจสอบ `NEXT_PUBLIC_API_URL`
- ตรวจสอบ CORS settings ใน backend
- ตรวจสอบว่า backend ทำงานอยู่

### Render Sleep:
- ใช้ UptimeRobot (ฟรี) เพื่อ ping backend ทุก 5 นาที
- หรือ upgrade เป็น paid plan

---

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ logs ใน dashboard
2. ตรวจสอบ environment variables
3. ตรวจสอบ database connection
4. ดู documentation ของแต่ละ platform

---

**Happy Free Deploying! 🆓🚀**


# 🚀 วิธี Deploy ฟรีแบบง่าย (3 ขั้นตอน)

## 📋 สิ่งที่ต้องมี:
- ✅ GitHub account (ฟรี)
- ✅ Email สำหรับสมัคร accounts

---

## 🎯 วิธีที่ง่ายที่สุด: Vercel + Railway + Supabase

### ⏱️ เวลาที่ใช้: ~30 นาที

---

## ขั้นตอนที่ 1: Database (Supabase) - 5 นาที

1. ไปที่ **https://supabase.com**
2. คลิก **Start your project** → **Sign up** (ใช้ GitHub)
3. คลิก **New Project**
4. ตั้งค่า:
   - **Name**: `ecommerce-db`
   - **Database Password**: ตั้งรหัสผ่าน (บันทึกไว้!)
   - **Region**: เลือกใกล้ที่สุด (Singapore)
5. คลิก **Create new project**
6. รอให้สร้างเสร็จ (~2 นาที)
7. ไปที่ **Settings** (⚙️) → **Database**
8. คัดลอก **Connection string** (URI format)
   - ตัวอย่าง: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

✅ **เสร็จแล้ว!** คัดลอก Connection string ไว้

---

## ขั้นตอนที่ 2: Backend (Railway) - 10 นาที

1. ไปที่ **https://railway.app**
2. คลิก **Login** → **Login with GitHub**
3. คลิก **New Project** → **Deploy from GitHub repo**
4. เลือก repository ของคุณ
5. Railway จะ auto-detect `backend` folder
6. ไปที่ **Variables** tab → คลิก **+ New Variable**
7. เพิ่ม Environment Variables ตามนี้:

```bash
# Database (จาก Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# JWT (สร้างเอง - ใช้ตัวอักษรสุ่ม 32 ตัวขึ้นไป)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe (ถ้ามี - ใช้ test keys ก่อน)
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

8. รอให้ deploy เสร็จ (~3-5 นาที)
9. ไปที่ **Settings** → **Networking** → **Generate Domain**
10. คัดลอก URL (เช่น `https://your-backend.up.railway.app`)

✅ **เสร็จแล้ว!** คัดลอก Backend URL ไว้

### 🔧 Run Migrations:

1. ไปที่ **Deployments** tab
2. คลิกที่ deployment ล่าสุด
3. คลิก **View Logs** → **Shell** (หรือ **Open Shell**)
4. รันคำสั่ง:
   ```bash
   npm run prisma:generate
   npm run prisma:deploy
   ```

---

## ขั้นตอนที่ 3: Frontend (Vercel) - 5 นาที

1. ไปที่ **https://vercel.com**
2. คลิก **Sign Up** → **Continue with GitHub**
3. คลิก **Add New Project** → **Import Git Repository**
4. เลือก repository ของคุณ
5. ตั้งค่า:
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: `frontend` ⚠️ **สำคัญ!**
   - **Build Command**: `npm run build` (auto-detect)
   - **Output Directory**: `.next` (auto-detect)
6. **Environment Variables** → คลิก **Add**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
   (ใช้ Backend URL จาก Railway)
7. คลิก **Deploy**
8. รอให้ deploy เสร็จ (~2-3 นาที)
9. คัดลอก URL (เช่น `https://your-app.vercel.app`)

✅ **เสร็จแล้ว!** คัดลอก Frontend URL ไว้

---

## ขั้นตอนที่ 4: Update URLs - 2 นาที

### 1. Update Backend (Railway):

1. กลับไปที่ **Railway** → **Variables** tab
2. แก้ไข:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
   (ใช้ Frontend URL จาก Vercel)
3. Railway จะ auto-redeploy

### 2. Update Frontend (Vercel):

1. กลับไปที่ **Vercel** → **Settings** → **Environment Variables**
2. ตรวจสอบว่า:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   ```
   (ใช้ Backend URL จาก Railway)
3. ถ้ายังไม่ถูกต้อง → แก้ไข → **Redeploy**

---

## ✅ เสร็จแล้ว!

### 🎉 URLs ที่ได้:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.up.railway.app`
- **Database**: Supabase (internal)

### 📝 Checklist:

- [ ] Database สร้างเสร็จ (Supabase)
- [ ] Backend deploy เสร็จ (Railway)
- [ ] Migrations run แล้ว
- [ ] Frontend deploy เสร็จ (Vercel)
- [ ] URLs อัพเดทแล้ว
- [ ] ทดสอบ login/register
- [ ] ทดสอบ API calls

---

## 🐛 Troubleshooting

### Backend ไม่เชื่อมต่อ Database:
- ตรวจสอบ `DATABASE_URL` ใน Railway
- ตรวจสอบว่า password ถูกต้อง
- ใช้ connection string จาก Supabase

### Frontend ไม่เชื่อมต่อ Backend:
- ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน Vercel
- ตรวจสอบว่า Backend URL ถูกต้อง
- ตรวจสอบ CORS settings

### Build Failed:
- ตรวจสอบ logs ใน Railway/Vercel
- ตรวจสอบว่า environment variables ถูกต้อง
- ตรวจสอบว่า Root Directory ถูกต้อง (`frontend`)

---

## 💰 ราคา:

- **Vercel**: ฟรี ✅
- **Railway**: ฟรี $5 credit/เดือน ✅
- **Supabase**: ฟรี 500MB database ✅

**รวม: ฟรีทั้งหมด!** 🎉

---

## 📞 ต้องการความช่วยเหลือ?

1. ตรวจสอบ logs ใน Railway/Vercel
2. ตรวจสอบ environment variables
3. อ่าน `DEPLOY_FREE.md` สำหรับรายละเอียดเพิ่มเติม

---

**Happy Deploying! 🚀**


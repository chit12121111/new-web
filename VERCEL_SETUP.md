# ▲ คู่มือ Deploy Frontend บน Vercel (ฟรี)

Vercel เป็น platform ที่ดีที่สุดสำหรับ deploy Next.js ฟรี

## 📋 ขั้นตอนการ Deploy

### 1. สร้าง Account

1. ไปที่ https://vercel.com
2. คลิก **Sign Up** → **Continue with GitHub**
3. Authorize Vercel

### 2. Import Project

1. คลิก **Add New Project**
2. เลือก **Import Git Repository**
3. เลือก repository ของคุณ
4. คลิก **Import**

### 3. ตั้งค่า Project

1. **Project Name**: ตั้งชื่อ (เช่น `ecommerce-frontend`)
2. **Framework Preset**: Next.js (auto-detect)
3. **Root Directory**: `frontend` (สำคัญ!)
4. **Build Command**: `npm run build` (auto-detect)
5. **Output Directory**: `.next` (auto-detect)
6. **Install Command**: `npm install` (auto-detect)

### 4. ตั้งค่า Environment Variables

คลิก **Environment Variables** → เพิ่ม:

```bash
# Backend API URL (จาก Railway/Render)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# Stripe (ถ้ามี)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**สำคัญ**: 
- ใช้ `NEXT_PUBLIC_` prefix สำหรับ variables ที่ใช้ใน frontend
- Variables ที่ไม่มี prefix จะใช้ได้แค่ใน server-side

### 5. Deploy

1. คลิก **Deploy**
2. รอให้ build เสร็จ (ประมาณ 2-3 นาที)
3. เมื่อเสร็จจะได้ URL (เช่น `https://your-app.vercel.app`)

### 6. ตั้งค่า Custom Domain (Optional)

1. ไปที่ **Settings** → **Domains**
2. เพิ่ม domain ของคุณ
3. ตั้งค่า DNS records ตามที่ Vercel บอก
4. รอให้ DNS propagate (ประมาณ 5-10 นาที)

---

## 🔄 Auto-Deploy

Vercel จะ auto-deploy เมื่อ:
- Push code ไป `main` branch (production)
- Push code ไป branch อื่น (preview deployment)

---

## 📊 Monitor

1. ไปที่ **Analytics** tab
2. ดู traffic, performance
3. ดู errors (ถ้ามี)

---

## 🐛 Troubleshooting

### Build Failed:
- ตรวจสอบ logs ใน **Deployments** tab
- ตรวจสอบว่า `package.json` มี scripts ที่ถูกต้อง
- ตรวจสอบ environment variables

### API Calls Failed:
- ตรวจสอบ `NEXT_PUBLIC_API_URL`
- ตรวจสอบ CORS settings ใน backend
- ตรวจสอบว่า backend ทำงานอยู่

### Environment Variables ไม่ทำงาน:
- ตรวจสอบว่าใช้ `NEXT_PUBLIC_` prefix
- Redeploy หลังเพิ่ม/แก้ไข variables

---

## 💡 Tips

1. **ใช้ Preview Deployments** - ทดสอบก่อน merge
2. **Monitor Analytics** - ดู performance
3. **ใช้ Edge Functions** - สำหรับ serverless functions
4. **ตั้งค่า Custom Domain** - ดูเป็นมืออาชีพ

---

**เสร็จแล้ว! 🎉**


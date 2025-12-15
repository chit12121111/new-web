# 🚨 Quick Fix: Database Connection Error

## ❌ Error: `Can't reach database server at postgres.railway.internal:5432`

**ปัญหานี้เกิดจาก DATABASE_URL ใช้ internal hostname ที่ไม่สามารถเข้าถึงได้**

---

## ⚡ แก้ไขใน 3 ขั้นตอน (2 นาที)

### 1️⃣ ไปที่ Railway Dashboard
- เปิด https://railway.app
- เลือก project ของคุณ
- คลิก **Variables** tab

### 2️⃣ หาและแก้ไข DATABASE_URL
- หา `DATABASE_URL` ใน list
- คลิกเพื่อแก้ไข

### 3️⃣ แทนที่ด้วย URL ที่ถูกต้อง

#### **ถ้าใช้ Railway PostgreSQL:**
```
postgresql://postgres:[PASSWORD]@[HOST].railway.app:[PORT]/railway
```
**ตัวอย่าง:**
```
postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway
```

#### **ถ้าใช้ Supabase:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```
**ตัวอย่าง:**
```
postgresql://postgres:yourpassword@db.abcdefghijk.supabase.co:5432/postgres?sslmode=require
```

---

## ✅ ตรวจสอบว่าแก้ไขถูกต้อง

### ✅ ถูกต้อง:
- ✅ ไม่มี `railway.internal` ใน URL
- ✅ มี hostname ที่เป็น public (`.railway.app` หรือ `.supabase.co`)
- ✅ สำหรับ Supabase: มี `?sslmode=require` ที่ท้าย URL

### ❌ ผิด:
- ❌ มี `railway.internal` ใน URL
- ❌ ไม่มี `?sslmode=require` สำหรับ Supabase

---

## 🔄 หลังจากแก้ไข

1. **คลิก Save** ใน Railway
2. **Railway จะ auto-redeploy** (รอ 2-3 นาที)
3. **ตรวจสอบ logs** - ควรเห็น:
   ```
   ✅ Database connected successfully
   ```

---

## 🆘 ถ้ายังไม่ได้

### ตรวจสอบ:
1. **DATABASE_URL format ถูกต้องหรือไม่?**
   - ต้องเป็น `postgresql://` ไม่ใช่ `postgres://`
   - ต้องมี username, password, host, port, database

2. **Database service ทำงานอยู่หรือไม่?**
   - Railway: ตรวจสอบว่า PostgreSQL service ยัง active
   - Supabase: ตรวจสอบว่า project ยัง active

3. **ลองสร้าง Database ใหม่:**
   - ลบ service เดิม
   - สร้างใหม่
   - ใช้ DATABASE_URL ใหม่

---

## 📖 ดูรายละเอียดเพิ่มเติม

- `RAILWAY_DATABASE_FIX.md` - คำแนะนำแบบละเอียด
- `RAILWAY_SETUP.md` - คู่มือ setup Railway

---

**แก้ไขเสร็จแล้ว! 🎉**


# ⚡ คู่มือเพิ่มประสิทธิภาพ (Optimization Guide)

## 🧹 การทำความสะอาดไฟล์

### ใช้ Cleanup Script:

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File cleanup.ps1
```

**Linux/Mac:**
```bash
chmod +x cleanup.sh
./cleanup.sh
```

### ทำความสะอาดด้วยตนเอง:

```bash
# ลบ node_modules
rm -rf backend/node_modules frontend/node_modules

# ลบ build files
rm -rf backend/dist frontend/.next

# ลบไฟล์ log และ cache
find . -name "*.log" -delete
find . -name "*.cache" -delete
find . -name "*.tsbuildinfo" -delete
```

---

## 🚀 การเพิ่มประสิทธิภาพ

### 1. Next.js Optimizations

✅ **ทำแล้ว:**
- `swcMinify: true` - ใช้ SWC compiler (เร็วกว่า)
- `removeConsole` - ลบ console.log ใน production
- `compress: true` - เปิด compression
- `poweredByHeader: false` - ปิด X-Powered-By header
- Image optimization - รองรับ AVIF และ WebP

### 2. Backend Optimizations

✅ **ทำแล้ว:**
- `declaration: false` - ไม่สร้าง .d.ts files
- `sourceMap: false` - ไม่สร้าง source maps
- `removeComments: true` - ลบ comments

### 3. Build Optimizations

**Backend:**
```bash
npm run build:prod  # Production build
```

**Frontend:**
```bash
npm run build  # Production build with optimizations
```

---

## 📦 ลดขนาด Bundle

### 1. ลบ Dependencies ที่ไม่ใช้

```bash
# ตรวจสอบ dependencies ที่ไม่ใช้
cd backend
npx depcheck

cd ../frontend
npx depcheck
```

### 2. ใช้ Tree Shaking

Next.js จะ tree shake อัตโนมัติ แต่ต้องแน่ใจว่า:
- ใช้ ES modules (`import` แทน `require`)
- ไม่ใช้ `import * as` ถ้าไม่จำเป็น

### 3. Code Splitting

Next.js จะทำ code splitting อัตโนมัติสำหรับ:
- Pages (แต่ละ page เป็น bundle แยก)
- Dynamic imports

---

## 🗄️ Database Optimizations

### 1. Connection Pooling

ใช้ connection pooling สำหรับ production:
```env
DATABASE_URL=postgresql://...?connection_limit=10&pool_timeout=20
```

### 2. Indexes

ตรวจสอบว่า database มี indexes ที่จำเป็น:
```sql
-- ตัวอย่าง indexes ที่ควรมี
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_content_user_id ON "Content"(userId);
```

---

## 📊 Monitoring Performance

### 1. Next.js Bundle Analyzer

```bash
cd frontend
npm run build:analyze
```

### 2. Lighthouse

ใช้ Lighthouse เพื่อตรวจสอบ performance:
```bash
# ติดตั้ง Lighthouse CLI
npm install -g lighthouse

# รัน Lighthouse
lighthouse http://localhost:3000
```

---

## 🔧 Best Practices

### 1. Environment Variables

- ใช้ `.env.local` สำหรับ local development
- อย่า commit `.env` files
- ใช้ environment variables ใน production

### 2. Caching

- ใช้ Next.js Image component สำหรับ images
- ใช้ `getStaticProps` สำหรับ static pages
- ใช้ `getServerSideProps` สำหรับ dynamic pages

### 3. Code Quality

- ใช้ TypeScript strict mode (ถ้าเป็นไปได้)
- ใช้ ESLint และ Prettier
- ใช้ Husky สำหรับ pre-commit hooks

---

## 📈 Performance Metrics

### Target Metrics:

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

---

## 🐛 Troubleshooting

### Build ช้า:
- ลบ `node_modules` และติดตั้งใหม่
- ใช้ `npm ci` แทน `npm install`
- ตรวจสอบว่าไม่มี circular dependencies

### Bundle ใหญ่:
- ใช้ dynamic imports
- ลบ dependencies ที่ไม่ใช้
- ใช้ tree shaking

### Runtime ช้า:
- ตรวจสอบ database queries
- ใช้ indexes
- ใช้ caching

---

**Happy Optimizing! ⚡**


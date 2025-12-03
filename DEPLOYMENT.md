# 🚀 คู่มือการ Deploy Application

คู่มือนี้จะแนะนำวิธีการ deploy application ไปยัง production server

## 📋 สารบัญ

1. [เตรียมความพร้อม](#เตรียมความพร้อม)
2. [วิธีที่ 1: Docker Compose (แนะนำ)](#วิธีที่-1-docker-compose-แนะนำ)
3. [วิธีที่ 2: Deploy แยกส่วน](#วิธีที่-2-deploy-แยกส่วน)
4. [วิธีที่ 3: Deploy บน Cloud Platforms](#วิธีที่-3-deploy-บน-cloud-platforms)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 เตรียมความพร้อม

### สิ่งที่ต้องมี:
- ✅ Node.js 18+ และ npm
- ✅ Docker และ Docker Compose (ถ้าใช้วิธี Docker)
- ✅ PostgreSQL Database (หรือใช้ Docker)
- ✅ Domain name (ถ้าต้องการ)
- ✅ SSL Certificate (แนะนำใช้ Let's Encrypt)

### ไฟล์ที่ต้องเตรียม:
1. `.env` file สำหรับ backend
2. `.env.local` file สำหรับ frontend
3. Database migration

---

## 🐳 วิธีที่ 1: Docker Compose (แนะนำ)

วิธีนี้เหมาะสำหรับ VPS หรือ server ที่มี Docker

### ขั้นตอน:

#### 1. เตรียม Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```bash
# Database
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ecommerce_db
DATABASE_URL=postgresql://your_postgres_user:your_secure_password@postgres:5432/ecommerce_db

# JWT (ต้องเปลี่ยนเป็นค่าที่ปลอดภัย!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# URLs (เปลี่ยนเป็น domain ของคุณ)
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Rate Limiting
AI_RATE_LIMIT_TTL=60
AI_RATE_LIMIT_MAX=10

# Package Credits
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

#### 2. Build และ Run

```bash
# Build และ start services
docker-compose up -d --build

# ดู logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop และลบ volumes (ระวัง! จะลบข้อมูล)
docker-compose down -v
```

#### 3. Run Database Migrations

```bash
# เข้าไปใน backend container
docker exec -it ecommerce-backend sh

# Run migrations
npm run prisma:deploy

# (Optional) Seed database
npm run prisma:seed
```

#### 4. ตั้งค่า Reverse Proxy (Nginx)

สร้างไฟล์ `/etc/nginx/sites-available/yourdomain`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5. ตั้งค่า SSL (Let's Encrypt)

```bash
# ติดตั้ง Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# ขอ SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔧 วิธีที่ 2: Deploy แยกส่วน

### Backend (NestJS)

#### 1. เตรียม Server

```bash
# ติดตั้ง Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# ติดตั้ง PM2 (Process Manager)
sudo npm install -g pm2
```

#### 2. Deploy Backend

```bash
# Clone repository
git clone <your-repo-url>
cd "new web/backend"

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env
cp ../env.example .env
# แก้ไข .env ตามที่ต้องการ

# Generate Prisma Client
npm run prisma:generate

# Build
npm run build

# Run migrations
npm run prisma:deploy

# Start with PM2
pm2 start dist/main.js --name "ecommerce-backend"
pm2 save
pm2 startup
```

### Frontend (Next.js)

#### 1. Build Frontend

```bash
cd frontend

# สร้างไฟล์ .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
EOF

# Build
npm run build

# Start
pm2 start npm --name "ecommerce-frontend" -- start
pm2 save
```

---

## ☁️ วิธีที่ 3: Deploy บน Cloud Platforms

### Option A: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend on Vercel:

1. Push code ไป GitHub
2. ไปที่ [Vercel](https://vercel.com)
3. Import project
4. ตั้งค่า Environment Variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Deploy

#### Backend on Railway:

1. ไปที่ [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. เลือก backend folder
4. ตั้งค่า Environment Variables (ดูด้านล่าง)
5. Add PostgreSQL service
6. Deploy

#### Backend on Render:

1. ไปที่ [Render](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. ตั้งค่า:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm run start:prod`
5. ตั้งค่า Environment Variables
6. Add PostgreSQL database
7. Deploy

### Option B: DigitalOcean App Platform

1. ไปที่ [DigitalOcean](https://www.digitalocean.com)
2. Create App → GitHub
3. เลือก repository
4. ตั้งค่า:
   - **Backend**: 
     - Build Command: `cd backend && npm install && npm run build`
     - Run Command: `cd backend && npm run start:prod`
   - **Frontend**:
     - Build Command: `cd frontend && npm install && npm run build`
     - Run Command: `cd frontend && npm start`
5. Add PostgreSQL database
6. ตั้งค่า Environment Variables
7. Deploy

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=min-32-characters-secret-key
JWT_REFRESH_SECRET=min-32-characters-refresh-secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Rate Limiting
AI_RATE_LIMIT_TTL=60
AI_RATE_LIMIT_MAX=10

# Credits (ปรับตามต้องการ)
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

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🛠️ Troubleshooting

### ปัญหา: Database connection failed

**แก้ไข:**
- ตรวจสอบ `DATABASE_URL` ว่าถูกต้อง
- ตรวจสอบว่า PostgreSQL ทำงานอยู่
- ตรวจสอบ firewall rules

### ปัญหา: CORS error

**แก้ไข:**
- ตรวจสอบ `FRONTEND_URL` ใน backend `.env`
- ตรวจสอบ CORS settings ใน `backend/src/main.ts`

### ปัญหา: Prisma migration failed

**แก้ไข:**
```bash
# Reset database (ระวัง! จะลบข้อมูล)
npm run prisma:migrate reset

# หรือ migrate ใหม่
npm run prisma:deploy
```

### ปัญหา: Frontend ไม่สามารถเชื่อมต่อ Backend

**แก้ไข:**
- ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน frontend
- ตรวจสอบว่า backend ทำงานอยู่
- ตรวจสอบ CORS settings

### ปัญหา: Build failed

**แก้ไข:**
```bash
# ลบ node_modules และ build ใหม่
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Checklist ก่อน Deploy

- [ ] เปลี่ยน JWT secrets เป็นค่าที่ปลอดภัย
- [ ] ตั้งค่า Stripe keys (production)
- [ ] ตั้งค่า Database URL
- [ ] ตั้งค่า Frontend และ API URLs
- [ ] Run database migrations
- [ ] ทดสอบ API endpoints
- [ ] ตั้งค่า SSL certificate
- [ ] ตั้งค่า backup database
- [ ] ตั้งค่า monitoring/logging
- [ ] ตั้งค่า rate limiting
- [ ] ทดสอบ payment flow

---

## 🔄 Update Application

### Docker Compose:

```bash
# Pull latest code
git pull

# Rebuild และ restart
docker-compose up -d --build

# Run migrations (ถ้ามี)
docker exec -it ecommerce-backend npm run prisma:deploy
```

### PM2:

```bash
# Pull latest code
git pull

# Rebuild
cd backend && npm run build
cd ../frontend && npm run build

# Restart
pm2 restart ecommerce-backend
pm2 restart ecommerce-frontend
```

---

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ logs: `docker-compose logs` หรือ `pm2 logs`
2. ตรวจสอบ environment variables
3. ตรวจสอบ database connection
4. ตรวจสอบ network/firewall settings

---

**Happy Deploying! 🚀**


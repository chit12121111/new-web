# 🚀 Quick Start Guide - Deploy เร็วๆ

## วิธีที่เร็วที่สุด: Docker Compose

### 1. เตรียมไฟล์ .env

```bash
# สร้างไฟล์ .env ใน root directory
cp env.example .env

# แก้ไข .env ตามที่ต้องการ (สำคัญ!)
# - เปลี่ยน JWT_SECRET และ JWT_REFRESH_SECRET
# - เปลี่ยน DATABASE_URL
# - เปลี่ยน FRONTEND_URL และ NEXT_PUBLIC_API_URL
```

### 2. Build และ Run

```bash
# Build และ start
docker-compose up -d --build

# ดู logs
docker-compose logs -f
```

### 3. Run Migrations

```bash
# เข้าไปใน backend container
docker exec -it ecommerce-backend sh

# Run migrations
npm run prisma:deploy

# (Optional) Seed data
npm run prisma:seed
```

### 4. ตรวจสอบ

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Database: localhost:5433

---

## Deploy บน VPS (Ubuntu/Debian)

### 1. ติดตั้ง Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. ติดตั้ง Docker Compose

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 3. Clone และ Deploy

```bash
# Clone repository
git clone <your-repo-url>
cd "new web"

# สร้าง .env
cp env.example .env
nano .env  # แก้ไขตามที่ต้องการ

# Build และ start
docker-compose up -d --build

# Run migrations
docker exec -it ecommerce-backend npm run prisma:deploy
```

### 4. ตั้งค่า Nginx (Reverse Proxy)

```bash
# ติดตั้ง Nginx
sudo apt-get install nginx

# สร้าง config
sudo nano /etc/nginx/sites-available/yourdomain
```

ใส่เนื้อหานี้:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

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
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ตั้งค่า SSL
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## Deploy บน Cloud (Railway/Render)

### Railway (แนะนำ)

1. ไปที่ https://railway.app
2. New Project → Deploy from GitHub
3. เลือก repository
4. Add PostgreSQL service
5. ตั้งค่า Environment Variables:
   - `DATABASE_URL` (จาก PostgreSQL service)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `FRONTEND_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
6. Deploy

### Render

1. ไปที่ https://render.com
2. New → Web Service
3. Connect GitHub
4. ตั้งค่า:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
5. Add PostgreSQL database
6. ตั้งค่า Environment Variables
7. Deploy

---

## Environment Variables ที่ต้องตั้งค่า

### Backend:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
FRONTEND_URL=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Troubleshooting

### Database connection failed
```bash
# ตรวจสอบ DATABASE_URL
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
docker-compose ps
```

### CORS error
```bash
# ตรวจสอบ FRONTEND_URL ใน backend .env
# ต้องตรงกับ domain ที่ใช้จริง
```

### Build failed
```bash
# ลบและ build ใหม่
docker-compose down
docker-compose up -d --build
```

---

**เสร็จแล้ว! 🎉**


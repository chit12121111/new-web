#!/bin/bash
# 🧹 Script สำหรับทำความสะอาดไฟล์ที่ไม่จำเป็น (Linux/Mac)

echo "🧹 กำลังทำความสะอาดไฟล์ที่ไม่จำเป็น..."

# ลบ node_modules
echo ""
echo "📦 ลบ node_modules..."
rm -rf backend/node_modules
rm -rf frontend/node_modules
echo "✅ ลบ node_modules แล้ว"

# ลบ dist (build files)
echo ""
echo "🗑️ ลบ dist (build files)..."
rm -rf backend/dist
echo "✅ ลบ backend/dist แล้ว"

# ลบ .next (Next.js build)
echo ""
echo "🗑️ ลบ .next (Next.js build)..."
rm -rf frontend/.next
echo "✅ ลบ frontend/.next แล้ว"

# ลบโฟลเดอร์ที่ซ้ำซ้อน
echo ""
echo "🗑️ ลบโฟลเดอร์ที่ซ้ำซ้อน..."
rm -rf backend/backend
echo "✅ ลบ backend/backend แล้ว"

# ลบไฟล์ log
echo ""
echo "🗑️ ลบไฟล์ log..."
find . -name "*.log" -type f -delete
echo "✅ ลบไฟล์ log แล้ว"

# ลบไฟล์ cache
echo ""
echo "🗑️ ลบไฟล์ cache..."
find . -name "*.cache" -type f -delete
find . -name "*.tsbuildinfo" -type f -delete
rm -rf .cache
echo "✅ ลบไฟล์ cache แล้ว"

# ลบไฟล์ backup
echo ""
echo "🗑️ ลบไฟล์ backup..."
find . -name "*.bak" -type f -delete
find . -name "*.backup" -type f -delete
find . -name "*~" -type f -delete
echo "✅ ลบไฟล์ backup แล้ว"

# ลบไฟล์ temporary
echo ""
echo "🗑️ ลบไฟล์ temporary..."
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete
echo "✅ ลบไฟล์ temporary แล้ว"

echo ""
echo "✨ ทำความสะอาดเสร็จแล้ว!"
echo "💡 ใช้ 'npm install' ใน backend และ frontend เพื่อติดตั้ง dependencies ใหม่"


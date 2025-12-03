# 🧹 Script สำหรับทำความสะอาดไฟล์ที่ไม่จำเป็น

Write-Host "🧹 กำลังทำความสะอาดไฟล์ที่ไม่จำเป็น..." -ForegroundColor Cyan

# ลบ node_modules
Write-Host "`n📦 ลบ node_modules..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Remove-Item -Path "backend\node_modules" -Recurse -Force
    Write-Host "✅ ลบ backend\node_modules แล้ว" -ForegroundColor Green
}
if (Test-Path "frontend\node_modules") {
    Remove-Item -Path "frontend\node_modules" -Recurse -Force
    Write-Host "✅ ลบ frontend\node_modules แล้ว" -ForegroundColor Green
}

# ลบ dist (build files)
Write-Host "`n🗑️ ลบ dist (build files)..." -ForegroundColor Yellow
if (Test-Path "backend\dist") {
    Remove-Item -Path "backend\dist" -Recurse -Force
    Write-Host "✅ ลบ backend\dist แล้ว" -ForegroundColor Green
}

# ลบ .next (Next.js build)
Write-Host "`n🗑️ ลบ .next (Next.js build)..." -ForegroundColor Yellow
if (Test-Path "frontend\.next") {
    Remove-Item -Path "frontend\.next" -Recurse -Force
    Write-Host "✅ ลบ frontend\.next แล้ว" -ForegroundColor Green
}

# ลบโฟลเดอร์ที่ซ้ำซ้อน
Write-Host "`n🗑️ ลบโฟลเดอร์ที่ซ้ำซ้อน..." -ForegroundColor Yellow
if (Test-Path "backend\backend") {
    Remove-Item -Path "backend\backend" -Recurse -Force
    Write-Host "✅ ลบ backend\backend แล้ว" -ForegroundColor Green
}

# ลบไฟล์ log
Write-Host "`n🗑️ ลบไฟล์ log..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Include "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✅ ลบไฟล์ log แล้ว" -ForegroundColor Green

# ลบไฟล์ cache
Write-Host "`n🗑️ ลบไฟล์ cache..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Include "*.cache", "*.tsbuildinfo" -ErrorAction SilentlyContinue | Remove-Item -Force
if (Test-Path ".cache") {
    Remove-Item -Path ".cache" -Recurse -Force
}
Write-Host "✅ ลบไฟล์ cache แล้ว" -ForegroundColor Green

# ลบไฟล์ backup
Write-Host "`n🗑️ ลบไฟล์ backup..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Include "*.bak", "*.backup", "*~" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✅ ลบไฟล์ backup แล้ว" -ForegroundColor Green

# ลบไฟล์ temporary
Write-Host "`n🗑️ ลบไฟล์ temporary..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Include "*.tmp", "*.temp" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✅ ลบไฟล์ temporary แล้ว" -ForegroundColor Green

Write-Host "`n✨ ทำความสะอาดเสร็จแล้ว!" -ForegroundColor Green
Write-Host "Tip: Use 'npm install' in backend and frontend to reinstall dependencies" -ForegroundColor Cyan


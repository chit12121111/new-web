# PowerShell script to seed admin user via API
# Usage: .\scripts\seed-admin.ps1 [BACKEND_URL]

param(
    [string]$BackendUrl = "https://new-web-production-e3a0.up.railway.app"
)

Write-Host "🌱 Seeding admin user..." -ForegroundColor Green
Write-Host "📡 Backend URL: $BackendUrl" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/setup/seed" `
        -Method Post `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "📥 Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10

    if ($response.message -like "*Seed completed successfully*") {
        Write-Host ""
        Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
        Write-Host "📧 Email: admin@example.com" -ForegroundColor Cyan
        Write-Host "🔑 Password: password123" -ForegroundColor Cyan
    } elseif ($response.message -like "*already exists*") {
        Write-Host ""
        Write-Host "ℹ️  Admin user already exists" -ForegroundColor Yellow
        Write-Host "📧 Email: admin@example.com" -ForegroundColor Cyan
        Write-Host "🔑 Password: password123" -ForegroundColor Cyan
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "⚠️  Make sure the backend is deployed and accessible" -ForegroundColor Yellow
}


# How to Seed Admin User

## Quick Start

### Option 1: Use PowerShell Script (Windows)

```powershell
.\scripts\seed-admin.ps1
```

Or with custom backend URL:
```powershell
.\scripts\seed-admin.ps1 -BackendUrl "https://your-backend-url.up.railway.app"
```

### Option 2: Use curl

```bash
curl -X POST https://new-web-production-e3a0.up.railway.app/api/setup/seed \
  -H "Content-Type: application/json"
```

### Option 3: Use Browser or Postman

1. Open browser or Postman
2. Make POST request to: `https://new-web-production-e3a0.up.railway.app/api/setup/seed`
3. No body required

### Option 4: Use Railway CLI

```bash
railway run curl -X POST http://localhost:4000/api/setup/seed -H "Content-Type: application/json"
```

## After Seeding

Once the seed is successful, you can login with:

- **Email**: `admin@example.com`
- **Password**: `password123`

## Troubleshooting

### If you get "404 Not Found"
- Make sure the backend is deployed with the latest code
- Check that the endpoint `/api/setup/seed` exists

### If you get "Admin user already exists"
- The admin user is already created
- You can login with the credentials above

### If you get connection errors
- Check that the backend URL is correct
- Make sure Railway service is running
- Check Railway logs for errors


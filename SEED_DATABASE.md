# How to Seed Database

## Option 1: Using Railway CLI (Recommended)

```bash
# Make sure you're in the backend directory
cd backend

# Run seed script through Railway
railway run npm run prisma:seed
```

## Option 2: Using Railway Dashboard

1. Go to Railway Dashboard
2. Select your Backend service
3. Go to "Settings" → "Deployments"
4. Click "New Deployment" → "Run Command"
5. Enter: `npm run prisma:seed`
6. Click "Deploy"

## Option 3: Register User via API

Use the frontend registration form or make a POST request:

```bash
POST https://your-backend-url.up.railway.app/api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

## Test Accounts (after seeding)

After running the seed script, you can use these test accounts:

- **Admin**: `admin@example.com` / `password123`
- **Try-out**: `tryout@example.com` / `password123`
- **Free**: `free@example.com` / `password123`
- **Basic**: `basic@example.com` / `password123`
- **Pro**: `pro@example.com` / `password123`


#!/bin/bash

# Script to seed admin user via API
# Usage: ./scripts/seed-admin.sh [BACKEND_URL]

BACKEND_URL=${1:-"https://new-web-production-e3a0.up.railway.app"}

echo "🌱 Seeding admin user..."
echo "📡 Backend URL: $BACKEND_URL"

response=$(curl -s -X POST "$BACKEND_URL/api/setup/seed" \
  -H "Content-Type: application/json")

echo "📥 Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

if echo "$response" | grep -q "Seed completed successfully"; then
  echo ""
  echo "✅ Admin user created successfully!"
  echo "📧 Email: admin@example.com"
  echo "🔑 Password: password123"
else
  echo ""
  echo "⚠️  Check the response above for details"
fi


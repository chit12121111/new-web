# 🚀 AI Content Generator - Full Stack E-commerce Platform

A complete, production-ready e-commerce platform with AI content generation, subscription management, and multi-tier user roles.

## ✨ Features

### 🎯 Core Features
- **AI Content Generation** - SEO articles and viral reel scripts powered by OpenAI GPT-4
- **4-Tier User System** - Guest, Try-out, Subscription (Free/Basic/Pro), and Admin
- **Stripe Integration** - Recurring billing, webhooks, and customer portal
- **Credit System** - Monthly credit allocation based on subscription tier
- **Content Library** - Save, manage, and download generated content
- **Admin Panel** - Comprehensive dashboard for user and content management

### 👥 User Roles

#### 🟦 Guest (Unauthenticated)
- ✅ View landing page and pricing
- ✅ Sign up / Login
- ❌ No AI access or dashboard

#### 🟩 Try-out User (7-Day Trial)
- ✅ 3 SEO Article credits
- ✅ 5 Reel Script credits
- ✅ Full AI generation
- ✅ Content library access
- ⏰ 7-day trial period

#### 🟧 Subscription Users
**Free Plan**
- ✅ Sample AI generation only
- ✅ Dashboard access
- ❌ No real credits

**Basic Plan ($29.99/month)**
- ✅ 50 SEO articles/month
- ✅ 100 Reel scripts/month
- ✅ Full features

**Pro Plan ($99.99/month)**
- ✅ 200 SEO articles/month
- ✅ 500 Reel scripts/month
- ✅ Priority support

#### 🟥 Admin
- ✅ User management
- ✅ Content management
- ✅ Payment reports
- ✅ Webhook logs
- ✅ Credit adjustment
- ✅ Plan management

## 🏗 Tech Stack

### Frontend
- **Next.js 14** - App Router with TypeScript
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - API client
- **React Hot Toast** - Notifications

### Backend
- **NestJS** - Node.js framework with TypeScript
- **Prisma ORM** - Database management
- **PostgreSQL** - Database
- **JWT** - Authentication (Access + Refresh tokens)
- **Stripe** - Payment processing
- **OpenAI API** - AI content generation

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Rate Limiting** - API protection

## 📦 Installation

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Stripe Account
- OpenAI API Key

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd new-web
```

### 2. Environment Setup

Copy `env.example` to `.env` in the root directory:

```bash
cp env.example .env
```

Edit `.env` and configure:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=ecommerce_db

# JWT (Generate secure keys!)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Stripe (Get from https://stripe.com)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# OpenAI (Get from https://platform.openai.com)
OPENAI_API_KEY=sk-your-openai-api-key

# URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Setup Stripe Plans

Before running the application, you need to create products and prices in Stripe:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create 3 products:
   - **FREE** (Free, $0)
   - **BASIC** (Basic Plan, $29.99/month recurring)
   - **PRO** (Pro Plan, $99.99/month recurring)
3. Copy the Price IDs
4. Update `backend/prisma/seed.ts` with your Stripe Price IDs

### 4. Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Alternative: Run Locally

#### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api
- **Database:** localhost:5432

## 👤 Test Accounts

After seeding, use these accounts (password: `password123`):

| Email | Role | Description |
|-------|------|-------------|
| admin@example.com | ADMIN | Full admin access |
| tryout@example.com | TRYOUT | 7-day trial user |
| free@example.com | FREE | Free plan user |
| basic@example.com | BASIC | Basic subscription |
| pro@example.com | PRO | Pro subscription |

## 🔧 Database Management

### Prisma Commands
```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:deploy

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

## 🎨 Project Structure

```
new-web/
├── backend/                    # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   ├── src/
│   │   ├── admin/             # Admin module
│   │   ├── ai/                # AI generation
│   │   ├── auth/              # Authentication
│   │   ├── contents/          # Content management
│   │   ├── payments/          # Payment & webhooks
│   │   ├── subscriptions/     # Subscription logic
│   │   └── users/             # User management
│   └── Dockerfile
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/        # Auth pages
│   │   │   ├── dashboard/     # User dashboard
│   │   │   └── admin/         # Admin panel
│   │   ├── components/        # React components
│   │   │   └── ui/            # UI components
│   │   ├── lib/               # Utilities
│   │   └── store/             # Zustand store
│   └── Dockerfile
├── docker-compose.yml         # Docker configuration
├── env.example               # Environment template
└── README.md                 # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### AI Generation
- `POST /api/ai/generate-seo` - Generate SEO article
- `POST /api/ai/generate-reel` - Generate reel script

### Content Library
- `GET /api/contents` - Get user contents
- `GET /api/contents/:id` - Get content by ID
- `DELETE /api/contents/:id` - Delete content
- `GET /api/contents/stats` - Get content stats

### Subscriptions
- `GET /api/subscriptions/plans` - Get all plans
- `GET /api/subscriptions/my-subscription` - Get user subscription
- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/subscriptions/portal` - Open customer portal
- `POST /api/subscriptions/cancel` - Cancel subscription

### Admin (Admin only)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/credits` - Update credits
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/payments` - Payment reports
- `GET /api/admin/webhooks` - Webhook logs

## 🔐 Authentication Flow

1. User registers → JWT tokens issued
2. Access token (15min) stored in cookie
3. Refresh token (7 days) for token renewal
4. Protected routes check authentication
5. Role-based access control via guards

## 💳 Stripe Integration

### Webhook Setup

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

2. Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:4000/api/payments/webhook
```

3. Copy webhook secret to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Supported Events
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 🤖 AI Features

### SEO Article Generation
- 800-1200 words
- SEO optimized
- H2/H3 headings
- Engaging content

### Reel Script Generation
- 30-60 seconds
- Hook in first 3 seconds
- Scene descriptions
- Call-to-action

### Credit System
- Credits deducted per generation
- Monthly renewal for paid plans
- Try-out: One-time credits

## 🛡 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting on AI endpoints
- CORS protection
- Input validation
- Protected routes
- Role-based access control

## 🚀 Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.yml up -d --build
```

### Environment Variables (Production)

Make sure to set secure values for:
- JWT secrets (32+ characters)
- Database password
- Stripe keys (live mode)
- OpenAI API key

### Database Migrations

```bash
cd backend
npm run prisma:deploy
npm run prisma:seed
```

## 📊 Monitoring

- Check webhook logs in Admin Panel
- Monitor payment status
- Track user subscriptions
- View content generation stats

## 🐛 Troubleshooting

### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Issues
```bash
# Reset database
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### Stripe Webhook Issues
- Make sure webhook endpoint is publicly accessible
- Verify webhook secret in `.env`
- Check webhook logs in Stripe Dashboard

## 📝 License

MIT

## 🙏 Credits

Built with:
- Next.js
- NestJS
- Prisma
- Stripe
- OpenAI
- Tailwind CSS

---

## 🎉 Ready to Use!

Your complete AI Content Generator platform is now ready. Start by:

1. ✅ Setting up environment variables
2. ✅ Running `docker-compose up -d`
3. ✅ Creating Stripe products
4. ✅ Testing with provided accounts
5. ✅ Customizing for your needs

Happy coding! 🚀


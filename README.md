# Inventra — Business Management SaaS

> Manage Your Business Anytime, Anywhere

A full-featured business management web application built with Next.js 14, PostgreSQL (Neon), Prisma ORM, and Auth.js v5. Functionally equivalent to Karobar App with a modern tech stack.

---

## 🚀 Tech Stack

| Layer       | Technology |
|-------------|------------|
| Framework   | Next.js 14 (App Router) |
| Language    | TypeScript (strict) |
| Database    | PostgreSQL on Neon (serverless) |
| ORM         | Prisma 5 |
| Auth        | Auth.js v5 (Google, GitHub, Email magic link) |
| Styling     | Tailwind CSS v3 + shadcn/ui |
| Animations  | Framer Motion |
| Forms       | React Hook Form + Zod |
| State       | Zustand + TanStack Query v5 |
| Charts      | Recharts |
| Email       | Resend |
| Uploads     | Uploadthing |
| Deployment  | Vercel |

---

## 📁 Project Structure

```
inventra/
├── prisma/
│   ├── schema.prisma       ← Complete database schema
│   └── seed.ts             ← Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/login    ← Login page (dark split-screen)
│   │   ├── (dashboard)/    ← All authenticated pages
│   │   │   ├── dashboard
│   │   │   ├── parties
│   │   │   ├── expense
│   │   │   ├── income
│   │   │   ├── manage-account
│   │   │   ├── reports/
│   │   │   ├── business-tools/
│   │   │   ├── settings/
│   │   │   └── onboarding
│   │   └── api/auth/
│   ├── components/
│   │   ├── layout/         ← Sidebar, Header, Notifications, Command Palette
│   │   ├── dashboard/      ← Stat cards, Cashflow chart, etc.
│   │   ├── parties/        ← Party list, detail, payment modals
│   │   ├── expense/        ← Expense table, add modal
│   │   ├── income/         ← Income table, add modal
│   │   ├── accounts/       ← Accounts view
│   │   ├── reports/        ← All report views
│   │   ├── tools/          ← Business cards, reminders, notebook
│   │   ├── settings/       ← Category manager, settings UI
│   │   ├── shared/         ← EmptyState, etc.
│   │   └── ui/             ← shadcn/ui base components
│   ├── lib/
│   │   ├── auth.ts         ← Auth.js v5 config
│   │   ├── db.ts           ← Prisma singleton
│   │   ├── utils.ts        ← Helper functions
│   │   ├── constants.ts    ← App constants
│   │   ├── actions/        ← All Server Actions
│   │   └── validations/    ← Zod schemas
│   ├── stores/             ← Zustand stores
│   └── hooks/              ← Custom React hooks
```

---

## ⚡ Quick Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/inventra.git
cd inventra
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
# Neon Database
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Auth.js
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# Resend (email)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Uploadthing
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."
```

### 3. Database setup

```bash
# Push schema to database
npm run db:push

# Seed demo data
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Auth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`

### Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Resend Email
1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Add and verify your domain

---

## 📊 Features

### ✅ Implemented
- 🔐 Authentication (Google OAuth, GitHub OAuth, Email magic link)
- 🏢 Multi-profile (Business + Personal)
- 📊 Dashboard with cashflow charts and stat cards
- 👥 Parties management (customers & suppliers)
- 💸 Payment In / Payment Out with receipts
- 📝 Expense tracking with categories
- 💰 Income tracking with categories
- 🏦 Bank account management
- 📈 Reports (All Party, Expense Category, Cash Statement)
- 🔔 Reminders (Payment & Task)
- 💼 Business Card Generator
- 📓 Notebook
- ⚙️ Settings (Theme, Language, Currency, Calendar)
- 🌙 Dark / Light / Classic themes
- 🇳🇵 English & Nepali language support
- ⌨️ Command Palette (Ctrl+K) with keyboard shortcuts

### 🔄 In Progress
- Bill Gallery with image uploads
- Greeting Cards generator
- Income Category Report
- Party Statement Report
- Full Excel export on all reports

---

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push Prisma schema to DB
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
```

---

## 🚀 Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add all environment variables in the Vercel dashboard.

---

## 📝 Demo Credentials

After seeding: `demo@inventra.com` (magic link)

---

Built with ❤️ using Next.js, Prisma, and Neon PostgreSQL.

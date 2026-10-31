# 🛍️ Millennium Era — Shop Beyond Time

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel)](https://millennium-era-e-commerce-website.vercel.app)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

> **Millennium Era** is a premium, full-stack e-commerce web platform tailored specifically for Bangladesh (BDT ৳). Built for performance, security, and elegance, it features a complete customer shopping experience, seamless Bangladeshi payment methods, and an enterprise-grade administrative management console.

---

## 🌐 Live Application

- **Live Storefront**: [https://millennium-era-e-commerce-website.vercel.app](https://millennium-era-e-commerce-website.vercel.app)
- **Shop Catalog**: [https://millennium-era-e-commerce-website.vercel.app/shop](https://millennium-era-e-commerce-website.vercel.app/shop)
- **Admin Portal**: [https://millennium-era-e-commerce-website.vercel.app/admin](https://millennium-era-e-commerce-website.vercel.app/admin)
- **Account Login**: [https://millennium-era-e-commerce-website.vercel.app/login](https://millennium-era-e-commerce-website.vercel.app/login)

---

## ✨ Features & Capabilities

### 🛒 Customer Storefront Experience
- **Interactive Hero & Campaigns**: Dynamic sliding hero banners with customizable promotional links and call-to-actions.
- **Advanced Product Catalog**:
  - Live search across products, categories, and SKU codes.
  - Category filtering, price range slider, and multi-factor sorting (Newest, Price Low to High, Price High to Low, Rating).
  - Product variation selector (Color, Size, Custom Options) with dynamic stock indicator.
- **Cart & Wishlist Engine**:
  - Interactive slide-over cart drawer powered by persistent state (`Zustand`).
  - Single-click wishlist management with real-time feedback.
- **Tailored Bangladeshi Checkout**:
  - **Payment Options**: Cash on Delivery (COD), bKash, Nagad, and Rocket with transaction verification.
  - **Dynamic Delivery Fees**: Auto-calculation for Inside Dhaka (৳60) and Outside Dhaka (৳120), with automated **Free Delivery** over ৳5,000.
  - Clean guest and member checkout with automatic anti-autofill safety.
- **Customer Self-Service Portal**:
  - Order review, tracking progress timeline, downloadable invoice snapshots, and saved addresses.

---

### 👑 Enterprise Administrative Console (`/admin`)
- **Real-Time Analytics Dashboard**:
  - Revenue trends, order volume, average order value, conversion rates, and stock alerts visualised via `Recharts`.
- **Product & Variation Management**:
  - Full product CRUD, instant image upload & URL preview, regular price vs. discount pricing, and automated SKU generation.
  - Dedicated variation matrices for size/color combinations and individual stock allocations.
- **Real-Time Inventory Control**:
  - Restock logs, shipment intake, low stock threshold warnings, and single-click stock zeroing/clearing.
- **Category Hierarchy Management**:
  - Custom category slugs, navigation ordering, visual icons, and safe category deletion with product reassignment.
- **Order Fulfillment & Dispatch**:
  - Complete order processing pipeline (`Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered` → `Cancelled`).
  - Mobile payment verification console (bKash/Nagad/Rocket TrxID audit).
- **Staff & Role Delegation (RBAC)**:
  - Role management: Super Admin, Store Admin, Order Manager, Inventory Manager, Support Agent.
  - Granular task assignment (e.g. Catalog Edit, Order Fulfillment, Payment Verification).
- **Banners & Social Links Hub**:
  - Manage live promo banners, announcement bars, and active social media channels across the header and footer.
- **Fraud Prevention & Security**:
  - High-risk order detection, rapid cancellation, and security audit log tracing.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18.3](https://react.dev/), [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/), PostCSS, Autoprefixer |
| **Styling & Design** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand), React Context API |
| **Database & Backend** | [Supabase](https://supabase.com/) (PostgreSQL 15, GoTrue Auth, Row Level Security) |
| **Data Fetching** | [@tanstack/react-query](https://tanstack.com/query) |
| **Data Visualization** | [Recharts 2.15](https://recharts.org/) |
| **Form Management** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Testing** | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/) |
| **Deployment** | [Vercel](https://vercel.com/) with SPA Rewrite Configuration |

---

## 📁 Project Structure

```text
millennium-era/
├── public/                 # Static assets, logos, and favicon
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── admin/          # Admin header, sidebar, and layout blocks
│   │   ├── cart/           # Cart drawer and line item cards
│   │   ├── layout/         # Storefront Header, Footer, and layouts
│   │   ├── store/          # ProductCard, ProductGrid, HeroCarousel, etc.
│   │   └── ui/             # Radix UI primitives (Dialog, Button, Badge, etc.)
│   ├── contexts/           # AuthContext and global providers
│   ├── lib/                # Supabase client, utility helpers, and constants
│   ├── pages/              # Routed pages
│   │   ├── admin/          # Dashboard, Products, Orders, Staff, etc.
│   │   ├── auth/           # Login and Registration pages
│   │   └── store/          # Home, Shop, ProductDetail, Cart, Checkout, etc.
│   ├── services/           # Supabase RPC & REST API service clients
│   ├── stores/             # Zustand stores (Cart, UI, Wishlist)
│   ├── styles/             # Global CSS & Tailwind extensions
│   └── types/              # Full TypeScript schema & interface definitions
├── supabase/               # PostgreSQL schema migrations, RLS rules, and seeds
│   ├── COMPLETE_SETUP.sql  # Full database setup
│   ├── FIX_CREATE_ORDER.sql# Order generation RPC
│   └── FIX_STAFF_CREATION.sql # Staff creation & privilege elevation RPC
├── tests/                  # Vitest unit & security test suites
├── vercel.json             # Vercel SPA client-side routing rewrites
├── vite.config.ts          # Vite build configuration & path aliases
└── tailwind.config.js      # Custom theme colors (Brand Red, Gold, Onyx)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/zzzihanh-afk/millennium-era-e-commerce-website.git
cd millennium-era-e-commerce-website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# App Branding
VITE_APP_NAME="Millennium Era"
VITE_APP_TAGLINE="Shop Beyond Time"
VITE_APP_URL="http://localhost:5173"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to see the site running locally.

### 5. Running Tests & Quality Checks
```bash
# Run unit and security tests
npm run test:run

# Run TypeScript type check
npx tsc --noEmit

# Run production build
npm run build
```

---

## 🗄️ Database Setup (Supabase)

1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Run the SQL scripts located in the `/supabase` folder:
   - `COMPLETE_SETUP.sql`: Creates core tables (`products`, `categories`, `orders`, `profiles`, `audit_logs`, etc.) with strict Row Level Security (RLS).
   - `FIX_CREATE_ORDER.sql`: Installs the atomic order placement function.
   - `FIX_STAFF_CREATION.sql`: Enables staff creation and duty delegation.

---

## 🔒 Security Best Practices
- **Row Level Security (RLS)**: Enforced across all PostgreSQL tables. Customers can only read/write their own records; privileged operations require verified staff roles.
- **XSS & Injection Protection**: Inputs sanitized before persistence.
- **Password Security**: Managed securely via Supabase GoTrue Auth with bcrypt hashing (`gen_salt('bf')`).
- **Clean Forms**: Sensitive administrator fields use standard secure autocomplete guidelines.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Crafted with ❤️ for <b>Millennium Era</b> — <i>Shop Beyond Time</i>
</p>

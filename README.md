# PropFlow CRM — Real Estate Sales Enablement & Buyer Quotation Platform

A mobile-first, responsive **Real Estate CRM, Quotation & Amortization Engine, Property Storefront, and Meta Messenger Hub** built with **Next.js 15 (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS + Shadcn/UI**, **Zustand**, **React Hook Form + Zod**, **`@react-pdf/renderer`**, and **Firebase (Authentication, Cloud Firestore, Cloud Storage, and App Hosting)**.

---

## Key Modules & Routes

| Route | Module | Core Capabilities |
| :--- | :--- | :--- |
| `/` | **Sales Command Center** | Live KPI summary cards (Active Pipeline Value, Messenger Threads, Available Units, Projected Net Commission) and a **Priority Buyer Follow-Up Queue**. |
| `/pipeline` | **Lead Kanban & Table View** | 6-stage drag-and-drop Kanban board (`NEW_LEAD`, `CONTACTED`, `SITE_TRIPPING`, `PROPOSAL_SENT`, `RESERVATION`, `CLOSED_WON`), responsive table toggle, lead capture modal, and buyer detail drawer. |
| `/inbox` | **Meta Messenger Hub** | Two-way buyer messaging inbox, **AI Draft Copilot**, `/shortcut` saved reply templates, one-click quotation attachments, and a live Meta Webhook payload simulator. |
| `/quotations` | **Quotation & Amortization Calculator** | Real-time calculation engine supporting **Bank Financing**, **Pag-IBIG / HDMF**, **In-House Financing**, and **Spot/Deferred Cash**, **Annual Balloon / Lumpsum Equity** (Months 12/24/36), 3-way financing comparison, and branded PDF export. |
| `/quote/[token]` | **Buyer Quotation Portal** | Client-facing interactive computation sheet with down payment/loan tenor customizer, **HTML5 Canvas E-Signature Pad**, and **Reservation Fee Receipt Upload** that automatically creates a Deal Room in `/deals`. |
| `/properties` | **Property Inventory & Stacking Plan** | Add pre-selling or RFO units with direct photo/video uploads, update unit availability (`AVAILABLE`, `ON_HOLD`, `RESERVED`, `SOLD`), and inspect the **Interactive Tower Stacking Plan**. |
| `/showcase` | **Property Storefront & Virtual Tours** | Public-ready property showcase with category filters, high-definition photo gallery carousels, and `.mp4` model unit walkthrough video player. |
| `/deals` | **Deal Rooms & Commission Tracker** | Closing KYC & loan takeout checklist, verified reservation receipts, 100% commission split allocation with EWT withholding tax, and **Downloadable Commission Voucher PDF**. |
| `/trippings` | **Site Tripping Scheduler** | Schedule showroom viewings, send automated Messenger gate passes, and export `.ics` calendar invites. |
| `/inquire` | **Public Lead Capture Form** | Captures online buyer inquiries directly into the Kanban pipeline and redirects to a personalized `/quote/[token]` computation portal. |
| `/login` | **Agent Authentication** | Email/Password registration & sign-in, Google Sign-In, and multi-tenant Cloud Firestore workspace synchronization. |
| `/api/webhooks/messenger` | **Meta Messenger Webhook** | `GET` verification challenge handler and `POST` `X-Hub-Signature-256` HMAC-SHA256 verified webhook endpoint. |

---

## Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables (`.env.local`):**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=propflow-crm-estate-2026.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=propflow-crm-estate-2026
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=propflow-crm-estate-2026.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=495877269210
   NEXT_PUBLIC_FIREBASE_APP_ID=1:495877269210:web:71e8c54f7ef6dcf03727e3
   META_WEBHOOK_VERIFY_TOKEN=propflow_meta_verify_secret_2026
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Run linting & strict TypeScript checks:**
   ```bash
   npm run lint
   npm run typecheck
   ```

---

## Firebase App Hosting Deployment

This project includes pre-configured [apphosting.yaml](./apphosting.yaml), [firebase.json](./firebase.json), [.firebaserc](./.firebaserc), [firestore.rules](./firestore.rules), and [storage.rules](./storage.rules) for project `propflow-crm-estate-2026`.

1. **Create the App Hosting backend (requires Blaze plan):**
   ```bash
   npx firebase-tools apphosting:backends:create --project propflow-crm-estate-2026
   ```
2. **Deploy from source:**
   ```bash
   npx firebase-tools deploy --only apphosting
   ```
3. **Deploy Firestore & Storage security rules:**
   ```bash
   npx firebase-tools deploy --only firestore:rules,storage
   ```


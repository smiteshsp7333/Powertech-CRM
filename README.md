# Powertech CRM & ERP - Enterprise Industrial Management Platform

Powertech CRM & ERP is a production-ready, full-stack enterprise web application designed to manage the end-to-end industrial product and service lifecycle:

Enquiry -> Quotation (Revisions & Server PDF) -> Order -> Dispatch & Delivery (Photo Proofs) -> Billing & Payment Collections (GST & Ageing) -> Procurement & Daily Summary -> Executive Dashboard & Reports.

---

## Technical Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript, Tailwind CSS, Lucide React (SVG icons), Recharts, Glassmorphic Design System.
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, OpenAPI/Swagger Docs, JWT Auth with Refresh Tokens, Bcrypt hashing.
- **Database**: PostgreSQL with Prisma migrations (and zero-config SQLite development mode).
- **Document Engines**: PDFKit (server-side PDF quotations and invoices), ExcelJS (8 report registers).
- **Storage**: Multi-part disk adapter with S3-compatible service interface for completion photo proofs.
- **Deployment**: Docker, `docker-compose.yml` (PostgreSQL, Backend API, Next.js Frontend, Nginx reverse proxy), automated daily backup script (`backup.sh`).

---

## Module Design & Theme Colors

| Module | Purpose | Theme Color | Hex Code |
| :--- | :--- | :--- | :--- |
| **Enquiry** | Lead qualification, customer type (Individual/Company), timeline | Blue | `#2563eb` |
| **Quotation** | Itemized pricing, taxes/discounts, revisioning, PDF download | Purple | `#7c3aed` |
| **Orders** | Production fulfillment, milestone tracking, cancellation reason | Orange | `#ea580c` |
| **Dispatch & Delivery** | Consignment tracking, partial dispatches, photo proof upload | Teal | `#0d9488` |
| **Billing & Payments** | System/External invoices, GST split, part payments, 0-90+ day ageing | Green | `#16a34a` |
| **Purchases** | Vendor procurement, supplier bills feeding daily cash flow | Red | `#dc2626` |
| **Daily Summary** | Reconciled billing, collections, purchases, and manual adjustments | Sky Blue | `#0284c7` |
| **Reports & Dashboard** | KPI metrics, 8 operational registers, ExcelJS export | Slate Grey | `#475569` |

---

## Default Seeded Credentials

All accounts are created with password: `Password@123`

| Role | Email Address | Access Level & Scope |
| :--- | :--- | :--- |
| **Super Admin** | `admin@powertech.com` | Unrestricted master access across all records, users, and settings |
| **Sales** | `sales@powertech.com` | Enquiries, quotations, pricing, order conversion |
| **Operations** | `operations@powertech.com` | Order progress, courier tracking, partial dispatches, photo proofs |
| **Accounts** | `accounts@powertech.com` | Invoices, collections, receipt recording, outstanding ageing |
| **Purchase** | `purchase@powertech.com` | Suppliers, procurement bills, expense tracking |

*Note: The frontend includes a 1-click active test role switcher on the navigation bar and login screen to evaluate different role permissions instantaneously.*

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js v20+ or v22+
- npm v10+

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm test
npm run dev
```
Backend API will be running on `http://localhost:5000`.
OpenAPI Swagger documentation is accessible at `http://localhost:5000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be accessible at `http://localhost:3000`.

---

## Testing & Quality Verification

Run unit and integration test suites:
```bash
cd backend
npm test
```

Included Automated Test Suites:
1. `tests/numbering.test.ts`:
   - Verifies sequence numbers (ENQ-YYYY-00001, QTN-YYYY-00001, ORD-YYYY-00001, DSP-YYYY-00001, INV-YYYY-YY-00001).
   - Validates atomic database transaction increments preventing duplicate numbers under concurrency.
   - Validates Indian Financial Year formatting (e.g. `2026-27`).
2. `tests/calculations.test.ts`:
   - Validates quotation line item totals, percentage discounts, and fixed discounts.
   - Validates GST split calculations (Intra-state CGST + SGST vs Inter-state IGST).
   - Validates invoice balance tracking, overpayment protection, and payment statuses (UNPAID, PARTIALLY_PAID, PAID, OVERDUE).
   - Validates 0-30, 31-60, 61-90, and 90+ days ageing buckets.
3. `tests/rbac.test.ts`:
   - Proves unauthenticated calls receive HTTP 401 Unauthorized.
   - Proves restricted roles (e.g. Sales) calling unauthorized endpoints (e.g. Purchases) receive HTTP 403 Forbidden.
   - Proves authorized roles (e.g. Accounts) access billing endpoints with HTTP 200 OK.
   - Proves Super Admin retains full bypass privileges.

---

## Docker Production Deployment

To launch the full production environment with PostgreSQL, Express API, Next.js Frontend, and Nginx reverse proxy:

```bash
docker-compose up --build -d
```

- Portal Gateway: `http://localhost`
- API Endpoints: `http://localhost/api`
- API Documentation: `http://localhost/docs`

---

## Automated Daily Database Backup

The repository includes `backup.sh`, configured for daily crontab automation:

```bash
chmod +x backup.sh
./backup.sh
```

- Exports compressed PostgreSQL dumps (`powertech_backup_YYYYMMDD_HHMMSS.sql.gz`).
- Verifies archive integrity and non-zero file size.
- Automatically cleans up archives older than 30 days retention.

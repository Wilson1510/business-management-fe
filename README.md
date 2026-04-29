# Business Management FE

Frontend application for **Business Management**, a simple ERP-style system for managing product catalogs, sales, purchases, and business contacts. Built with React 19, TypeScript, and Vite.

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Business metrics summary and top data |
| **Catalog** | Product, category, and unit management |
| **Sales** | Sales orders and deliveries |
| **Purchases** | Purchase orders and goods receipts |
| **Contacts** | Customer and supplier records |
| **Users** | User management with admin and staff roles |
| **Profile** | Change password for the current account |

### Access Control

- **Admin**: full access to all modules, including the dashboard and user management.
- **Staff**: limited access to catalog, deliveries, receipts, and profile.

---

## Tech Stack

| Area | Technology |
|------|------------|
| UI Framework | [React 19](https://react.dev) |
| Language | TypeScript ~6 |
| Build Tool | [Vite 8](https://vite.dev) |
| Routing | [React Router v7](https://reactrouter.com) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Linting | ESLint 9 + typescript-eslint |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |

---

## Requirements

- Node.js >= 18
- npm >= 9
- A running backend API. See [Environment](#environment).

---

## Installation

```bash
# Clone the repository
git clone <repository-url> business-management-fe
cd business-management-fe

# Install dependencies
npm install
```

---

## Environment

Copy the example environment file and fill in the values:

```bash
cp env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_ORIGIN` | Backend API base URL | `http://localhost:8000` |

---

## Running the App

```bash
# Development
npm run dev

# Production build
npm run build
```

---

## Testing

```bash
npm run test:run
```

Tests are stored in the `tests/` directory, mirroring the `src/` structure:

```text
tests/
|-- components/
|   |-- auth/
|   `-- layout/
|-- pages/
|-- services/
|-- utils/
`-- setup/
    `-- vitest-setup.ts
```

---

## Project Structure

```text
src/
|-- components/
|   |-- auth/          # AuthContext, ProtectedRoute, StaffRouteGuard
|   |-- layout/        # AppLayout, CatalogLayout, SalesLayout, etc.
|   |-- order-form/    # Reusable order form components
|   `-- ui/            # Shared UI components such as badges, modals, and buttons
|-- pages/             # Route-level pages
|-- services/          # Domain-based HTTP service wrappers
|-- utils/             # Helpers for formatting, auth paths, errors, and toasts
|-- App.tsx            # Routing definition
`-- main.tsx           # Entry point
```

---

## Authentication

- Login uses JWT; tokens are stored in `localStorage` as `access` and `refresh`.
- Each authenticated request includes the `Authorization: Bearer <access>` header.
- `AuthContext` loads the current user profile with `GET /api/users/me/` when the app starts.
- Protected pages are guarded by `ProtectedRoute`; staff access is restricted by `StaffRouteGuard`.

---

## License

Copyright (c) 2026. All rights reserved.

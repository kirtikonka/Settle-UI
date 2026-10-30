# 💸 SettleWise — Splitwise Clone in Angular

A modern, responsive Splitwise clone built with **Angular (v22)** featuring Standalone Components, Signals-based reactive state management, modern control flow (`@if`, `@for`, `@switch`), lazy-loaded routing, and Splitwise's signature **debt simplification algorithm** (Min-Cash-Flow).

---

## 🚀 Features

- **📊 Dashboard**:
  - Live total balance card (`+You are owed`, `-You owe`, `Total balance`).
  - Splitwise two-column relationship view:
    - **YOU ARE OWED**: List of friends who owe you money with quick "Settle" action.
    - **YOU OWE**: List of friends you owe with quick "Pay Back" action.
  - Recent expenses feed with category icons and individual share breakdowns.

- **👥 Groups Management**:
  - Group categorization (`Trip / Vacation ✈️`, `Home / Flatmates 🏠`, `Couple ❤️`, `Other ✨`).
  - Group Detail view with 4 interactive tabs:
    1. **Expenses**: All shared bills in this group, payer info, and deletion.
    2. **Balances**: Group-level net balance for each member.
    3. **⚡ Simplified Debts**: Splitwise's Min-Cash-Flow algorithm reduces cyclical debts into the minimum number of transactions (e.g. *Sarah Jenkins pays Alex Chen $35.00*). Includes a 1-click **"Settle This"** button.
    4. **Members**: Group members directory with role badges (`admin`, `member`).

- **🤝 Friends Management**:
  - Friends list with live balance indicators (green for positive, orange for negative, gray for settled).
  - Search filter by friend name or email.
  - Individual friend ledger:
    - Net balance banner with that friend.
    - Full history of shared bills (both direct and group expenses).
    - Cash/UPI/bank settlement history.

- **🧾 Add Expense Modal**:
  - Context selector: Add to any group or individual friend.
  - Category picker (`Food`, `Groceries`, `Transport`, `Travel`, `Entertainment`, `Utilities`, `Rent`, `Shopping`, `General`).
  - Payer selector: Supports any member or current user.
  - 4 Split Modes:
    1. **Equally (=)**: Automatically divides total among checked members with rounding reconciliation.
    2. **Exact ($)**: Enter exact amounts with real-time balance validation.
    3. **Percentages (%)**: Specify percentages with 100% total validation.
    4. **Shares (x)**: Specify ratio parts (1 part, 2 parts, etc.).

- **🤝 Settle Up Modal**:
  - Select payer and receiver (with instant direction swap button).
  - Pre-fills exact debt amount or allows partial settlements.
  - Payment method choices: UPI, Cash, Venmo, PayPal, Bank Transfer.

- **⚡ Activity Feed**:
  - Chronological timeline of added expenses, updates, deletions, settlements, and new groups.
  - Category filter: *All Activity*, *Expenses Only*, *Payments & Settlements*, *Groups & Friends*.

- **💾 State Persistence & Demo Data**:
  - Backed by reactive Angular Signals and auto-persists to `localStorage`.
  - Comes pre-seeded with realistic groups (*Goa Vacation*, *Apartment 402 Roomies*, *Weekend Diners*), expenses, and friends.
  - **"Reset Demo"** button in header to restore demo state at any time.
  - Multi-currency toggle ($ USD, € EUR, £ GBP, ₹ INR).

---

## 📂 Project Structure

```
src/
├── app/
│   ├── app.config.ts                     # Application configuration & providers
│   ├── app.routes.ts                     # Lazy-loaded routes configuration
│   ├── app.ts                            # Root component
│   │
│   ├── core/                             # Core models, state services
│   │   ├── models/
│   │   │   ├── user.model.ts             # User & Friend interfaces
│   │   │   ├── group.model.ts            # Group, GroupMember & SimplifiedDebt
│   │   │   ├── expense.model.ts          # Expense, ExpenseSplit & SplitType
│   │   │   ├── settlement.model.ts       # Settlement payment model
│   │   │   └── activity.model.ts         # Activity feed log item
│   │   └── services/
│   │       ├── splitwise.service.ts      # Signals state store & debt simplification logic
│   │       └── modal.service.ts          # Global modal dialogs trigger state
│   │
│   ├── layout/                           # Layout components
│   │   ├── header/                       # Top header with logo, currency, quick add
│   │   ├── sidebar/                      # Collapsible navigation, groups & friends lists
│   │   └── shell/                        # Layout wrapper with modals & router-outlet
│   │
│   ├── shared/                           # Reusable UI components & dialogs
│   │   ├── components/
│   │   │   ├── avatar/                   # Avatar image or colored initials
│   │   │   ├── badge/                    # Owed / Lent / Settled status badge
│   │   │   ├── empty-state/              # Polished empty list placeholders
│   │   │   └── modal/                    # Reusable dialog backdrop & card
│   │   └── modals/
│   │       ├── add-expense-modal/        # Dynamic split expense dialog
│   │       ├── settle-up-modal/          # Payment recording dialog
│   │       ├── create-group-modal/       # Group creation dialog
│   │       └── add-friend-modal/         # Friend creation dialog
│   │
│   └── features/                         # Feature route views
│       ├── dashboard/                    # Dashboard with balance cards & owe/owed lists
│       ├── groups/
│       │   ├── group-list/               # All groups grid
│       │   └── group-detail/             # Group expenses, balances, simplified debts & members
│       ├── friends/
│       │   ├── friend-list/              # All friends directory with search
│       │   └── friend-detail/            # Single friend balance & expense history
│       ├── activity/                     # Filterable activity stream
│       └── expenses/                     # Comprehensive expenses ledger with filters
│
├── styles.scss                           # Splitwise design system & tokens
└── index.html                            # App title, Plus Jakarta Sans & Material Symbols
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Running the Development Server

```bash
npm start
```
or:
```bash
ng serve
```

Navigate to `http://localhost:4200/`.

### Building for Production

```bash
npm run build
```

Build outputs will be generated in `dist/settle-ui/`.

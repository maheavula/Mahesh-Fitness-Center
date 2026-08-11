# Mahesh Fitness Center

**Tagline:** Train stronger. Move better. Live healthier.  
**Product Type:** Full-Stack Fitness Membership & Gym Management Simulator  
**UI Design Language:** Tactile Neumorphism  
**Persistence:** Atomic `/data/runtime.json`  
**API Limit:** Exactly 6 Logical API Groups  

---

## 1. Executive Summary

**Mahesh Fitness Center** is a complete, polished, end-to-end digital fitness club membership platform. It allows members to register, log in securely, activate simulated memberships, book group fitness classes, track training activities, and manage profiles. Administrators can manage members, plans, trainers, class schedules, bookings, attendance check-ins, simulated payment ledgers, and system audit logs.

---

## 2. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express, TypeScript, TS-Node / TSX, Cookie-Parser, Bcryptjs
- **Persistence:** Local atomic JSON datastore (`data/runtime.json`)
- **Authentication:** Server-side sessions with HTTP-only cookies and Bearer fallback
- **Currency:** Indian Rupee (INR ₹, stored in integer paise)

---

## 3. Demo Credentials

### 🛡️ Administrator Account
- **Email:** `admin@maheshfitness.local`
- **Password:** `Admin@12345`

### 🏋️ Member Account
- **Email:** `member@maheshfitness.local`
- **Password:** `Member@12345`

---

## 4. Architectural API Limit (Exactly 6 Groups)

1. `/api/auth` — Account signup, authentication login, logout, and current session user.
2. `/api/member` — Member profile management, dashboard analytics, attendance, activities, and stats.
3. `/api/classes` — Group class discovery, trainer showcase, schedule, bookings, and cancellations.
4. `/api/membership` — Membership plans, subscription activation, renewals, and payment history.
5. `/api/admin` — Gym operations center, member suspension, plan/trainer/class management, attendance markers, payments overview, and audit trail.
6. `/api/system` — Session status check, session token refresh, health check, and environment details.

---

## 5. Getting Started

### Installation
```bash
npm install
```

### Development Mode (Concurrent Frontend + Express Server)
```bash
npm run dev
```

- **Frontend Application:** `http://localhost:5173`
- **Express Backend API:** `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Run Tests
```bash
npm run test
```

---

## 6. Simulator Limitations

- All payment transactions, UPI transfers, and card authorizations are **simulated locally**.
- No real banking or payment gateways are connected.
- All application state is stored locally in `data/runtime.json`.
- No real medical or wearable device APIs are integrated.

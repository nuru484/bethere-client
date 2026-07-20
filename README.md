

# BeThere – Smart Attendance System Frontend

**BeThere Client** is the web app for a full-stack **smart attendance system** that verifies **live presence**. Instead of signing a sheet or tapping a card, a person scans a **rotating code shown on a screen at the venue** to prove they are physically there, then performs a short **face-liveness capture** so the server can confirm it is really them, live. It is built for organizations, schools, and recurring events where attendance records need to be genuinely hard to fake: you have to *be there*, in person.

This repository is the **React frontend**: it runs the in-app QR scanner and camera capture, renders the admin **venue-code display**, manages events and sessions, and renders the user and admin dashboards. It talks to the [BeThere-server](https://github.com/nuru484/BeThere-server.git) API, which does all verification server-side.

> **One-line pitch:** Verified live presence. Scan the venue's live code, then a real-time face check confirms it's you, all verified on the server, not your phone.

> **On the security claim:** no browser-based system is literally unfakeable (only a native app with hardware attestation fully closes live-relay collusion). BeThere aims to be *as close as a web app gets* and to leave a reviewable evidence trail for the rest.

---

## 🧠 How It Works

**1. Enrollment (consented).**
After an explicit biometric-consent step, the browser requests a liveness challenge and uploads a short burst of captured frames. The **server** derives the face template from those frames and stores it **encrypted**; the template is never computed in - nor sent back to - the browser.

**2. Presence: scan the rotating venue code.**
An admin opens the **venue-code display** for an event on a screen at the location; it shows a QR that rotates every **30 seconds**. To check in or out, the attendant scans the current code with the in-app scanner. A screenshotted code is stale within seconds.

**3. Identity: server-side liveness.**
After a valid scan, the app requests a challenge and the server returns a **randomized action sequence** (turn, blink, smile). The app captures a short burst of camera frames performing those actions and uploads them; the **server** verifies liveness and identity from the raw frames. Check-in and check-out both use this flow. The result is **PRESENT / LATE**.

**4. Roles & dashboards.**
Two roles (`ADMIN`, `USER`). **Users** check in/out and view their own history. **Admins** create/update/delete events, open the venue-code display, manage users, reset a user's face template, and view organization-wide analytics with charts (Recharts) and date-range filters.

**5. Secure client experience.**
Cookie-only auth with a silent-refresh **axios** interceptor, real-time data via **@tanstack/react-query** and **@tanstack/react-table**, **Zod** form validation, **context-based auth** with protected routes (`AuthContext` + `ProtectedRoutes.jsx`), React **Error Boundaries**, and a consistent UI built with **shadcn/ui** + **TailwindCSS**.

---

## 📚 Table of Contents

* [Features](#-features)
* [Tech Stack](#-tech-stack)
* [Architecture Overview](#-architecture-overview)
* [Authentication Flow](#-authentication-flow)
* [Project Structure](#-project-structure)
* [Environment Variables](#-environment-variables)
* [Getting Started](#-getting-started)
* [Deployment](#-deployment)
* [License](#-license)
* [Contributing](#-contributing)

---

## ✨ Features

### 👤 User Capabilities

* Login securely using credentials.
* **Reset a forgotten password** via an emailed, time-limited link — request a reset, verify the link, and set a new password.
* On first login, register your **facial scan** by following a few on-screen actions while the camera captures a burst of frames for the server to verify and enrol.
* Check in and out of **active event sessions** during their valid time windows.
* View:

  * Personal attendance history.
  * Attendance records for specific events.
  * Dashboard insights — including recent activities, active sessions, and event statistics.

### 🧭 Admin Capabilities

* Create, update, and delete events.
* Manage user records and reset user facial scans when needed.
* View organization-wide attendance data:

  * Attendance by user.
  * Attendance by event.
  * Overview of total users, total events, and active sessions.

### 💡 Smart Client Features

* Real-time communication with the backend API using **@tanstack/react-query**.
* Cookie-only auth (httpOnly tokens) with a silent-refresh **axios** interceptor; no tokens in JS-readable storage.
* In-app **QR scanner** (`@zxing/browser`) and an admin **venue-code display** (`qrcode.react`).
* Robust form validation powered by **Zod**.
* Consistent and elegant UI built with **Shadcn components** and **TailwindCSS**.
* Smooth user experience with **protected routes**, context-based authentication, and optimized component loading.

---

## 🛠️ Tech Stack

| Layer                  | Technology / Library                                            |
| ---------------------- | -------------------------------------------------------------- |
| **Framework**          | React (Vite)                                                   |
| **UI & Styling**       | shadcn/ui (Radix UI primitives) + TailwindCSS + tailwindcss-animate |
| **Icons**              | lucide-react                                                    |
| **Animation**          | framer-motion                                                  |
| **Server State / API** | @tanstack/react-query                                          |
| **HTTP Client**        | axios                                                          |
| **Data Tables**        | @tanstack/react-table                                          |
| **Charts**             | recharts                                                        |
| **Forms**              | react-hook-form + @hookform/resolvers                         |
| **Validation**         | Zod                                                            |
| **Face (enrollment)**  | Frame-burst capture only; the server derives the template     |
| **QR display / scan**  | qrcode.react (venue display) + @zxing/browser (in-app scanner) |
| **Image Conversion**   | heic2any (iPhone HEIC → JPEG before scanning)                 |
| **Routing**            | react-router-dom                                              |
| **Auth**               | Cookie-only httpOnly tokens (server-managed)                  |
| **Date Handling**      | date-fns + react-day-picker                                   |
| **Notifications**      | react-hot-toast                                                |
| **Error Handling**     | React Error Boundaries                                         |
| **Deployment**         | Vercel                                                         |

---

## 🏗️ Architecture Overview

```
User Interface (React + Shadcn)
   ↓
React Query (API Layer)
   ↓
BeThere Backend API (Express.js)
   ↓
Prisma ORM → PostgreSQL
   ↓
Redis (BullMQ Workers)
```

**Key Flow:**

1. Users authenticate with the backend via the frontend interface.
2. First-time login triggers a face-frame capture that the server verifies and enrols.
3. Events and attendance data are fetched dynamically from the backend.
4. Admins perform event and user management via protected dashboards.

---

## 🔐 Authentication Flow

**Login → Face Enrollment → Access App**

1. On login, the server sets **httpOnly access + refresh cookies** (never readable by page JavaScript).
2. The axios interceptor silently refreshes on expiry and redirects to login on failure.
3. First-time users are prompted to **register their face** (with consent).
4. Once verified, they gain full access to features like:

   * Mark attendance
   * View events
   * Access dashboards
5. Auth state is managed globally using **AuthContext**.
6. Routes are protected with `ProtectedRoutes.jsx`.

### Password Reset

A self-service flow backed by the BeThere API:

1. From the login screen, **Forgot password?** opens `/forgot-password`, where the user submits their email. The response is intentionally generic (no account enumeration).
2. The API emails a single-use, **15-minute** reset link pointing to `/reset-password?token=…`.
3. On load, `/reset-password` **verifies the token** with the API — showing a loading, invalid/expired, or ready state accordingly.
4. The user sets a new password (validated with **Zod**, mirroring the server rules); on success they're redirected to login.

Reset endpoints are **rate-limited** server-side to deter abuse.

---

## 🗂️ Project Structure

```
bethere-client/
│
├── public/                     # Static assets (favicon, og.png)
├── scripts/                    # generate-seo.mjs (robots.txt + sitemap.xml, run on prebuild)
│
├── src/
│   ├── api/                    # API interaction modules
│   ├── components/             # UI components (attendance, dashboard, event, users, etc.)
│   ├── context/                # React context providers (AuthContext)
│   ├── hooks/                  # Custom React hooks (useAuth, useEvent, etc.)
│   ├── lib/                    # Core utilities (ErrorBoundary, face capture, site config)
│   ├── pages/                  # Route-level pages
│   ├── routes/                 # App routing and protected route definitions
│   ├── test/                   # Test setup
│   ├── utils/                  # Helper functions
│   ├── validation/             # Zod validation schemas
│   ├── index.css               # Global styles
│   └── main.jsx                # App entry point
│
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following:

```bash
VITE_SERVER_URL="your backend uri"

# Optional error tracking; unset disables it
# VITE_SENTRY_DSN=

# Optional canonical site origin used by the SEO generator and meta tags.
# Defaults to https://bethere.manuru.dev
# VITE_SITE_URL=
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** ≥ 18
* **npm** or **yarn**

### Installation

```bash
# Clone repository
git clone git@github.com:your-username/bethere-client.git
cd bethere-client

# Install dependencies
npm install
```

### Running the App

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌍 Deployment

Deployed on **Vercel**

| Component        | Platform / Service |
| ---------------- | ------------------ |
| **Frontend**     | Vercel             |
| **Backend API**  | Render             |
| **File Storage** | Cloudinary         |
| **Database**     | PostgreSQL         |
| **Queue / Jobs** | Redis (BullMQ)     |

> 🧩 The frontend automatically connects to the backend using the `VITE_SERVER_URL` environment variable.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project, feel free to:

- **Fork** the repository
- **Create a feature branch** (`git checkout -b feature/amazing-feature`)
- **Commit your changes** (`git commit -m 'Add some amazing feature'`)
- **Push to the branch** (`git push origin feature/amazing-feature`)
- **Open a Pull Request**

Please ensure your code follows the project's style guidelines and includes appropriate tests where applicable.

For major changes, please open an issue first to discuss what you would like to change.

Questions or suggestions?
**[abdulmajeednurudeen47@gmail.com](mailto:abdulmajeednurudeen47@gmail.com)**

---

## 🧾 License

**MIT License**

Copyright (c) 2025 Nurudeen Abdul-Majeed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


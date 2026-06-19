

# <img src="public/assets/logo.png" alt="BeThere Logo" width="35" style="vertical-align: middle;"/> BeThere – Smart Attendance System Frontend

**BeThere Client** is the web app for a full-stack **smart attendance system** that verifies attendance using **facial recognition** combined with **GPS geolocation**. Instead of signing a sheet or tapping a card, a person looks into their device camera, the app matches their face against an enrolled scan, confirms they are physically within **50 meters** of the event location, and only then records them as present. It is built for organizations, schools, and recurring events where attendance records need to be genuinely hard to fake — you have to *be there*, in person.

This repository is the **React frontend**: it runs the in-browser face recognition, captures live GPS, manages events and sessions, and renders the user and admin dashboards. It talks to the [BeThere-server](https://github.com/nuru484/BeThere-server.git) API for everything else.

> **One-line pitch:** Attendance you can't fake — face recognition + GPS verification confirm the right person showed up at the right place, in real time.

---

## 🧠 How It Works

**1. In-browser face recognition.**
The app runs **face-api.js** with TensorFlow models loaded locally from `/public/models` (Tiny Face Detector, 68-point landmarks, face recognition, expression net). On first login a user enrolls their face: the app captures **3 samples**, extracts a **128-dimension descriptor** from each, and **averages them** into one stable face signature (`FaceAuthSystem.scanFace`). Verification compares two descriptors by **Euclidean distance** against a `0.6` threshold (`verifyFaceScan`). A **liveness check** (`performLivenessCheck`) watches for natural head movement and expression variance over ~2 seconds to resist someone holding up a static photo.

**2. Location-gated check-in.**
When a user checks in or out, the app captures live GPS coordinates and sends them to the backend, which validates the user is **within 50 meters** of the event location (via `@turf/turf`) and within the session's daily time window before recording a **PRESENT / LATE / ABSENT** status.

**3. Roles & dashboards.**
Two roles (`ADMIN`, `USER`). **Users** check in/out of active sessions and view their own attendance history, event records, and dashboard insights. **Admins** create/update/delete events, manage user records, **reset a user's face scan** when needed, and view organization-wide analytics — attendance by user, by event, and totals of users / events / active sessions, with charts (Recharts) and date-range filters.

**4. Secure client experience.**
Real-time data via **@tanstack/react-query** and **@tanstack/react-table**, **AES-encrypted** local storage for tokens and sensitive data, **Zod** form validation, **context-based auth** with protected routes (`AuthContext` + `ProtectedRoutes.jsx`), React **Error Boundaries**, and a consistent UI built with **shadcn/ui** + **TailwindCSS**.

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
* [Screenshots](#-screenshots) 
* [License](#-license)
* [Contributing](#-contributing)

---

## ✨ Features

### 👤 User Capabilities

* Login securely using credentials.
* **Reset a forgotten password** via an emailed, time-limited link — request a reset, verify the link, and set a new password.
* On first login, register your **facial scan** using **face-api.js** for future authentication.
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
* Secure local storage of tokens and sensitive data using **AES-encrypted storage**.
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
| **Face Recognition**   | face-api.js (in-browser TensorFlow models)                    |
| **Image Conversion**   | heic2any (iPhone HEIC → JPEG before scanning)                 |
| **Routing**            | react-router-dom                                              |
| **Auth Tokens**        | jwt-decode + encrypted local storage                         |
| **Storage Encryption** | AES via `encrypt-storage` (wrapped in `encryptedStorage.js`) |
| **Date Handling**      | date-fns + react-day-picker                                   |
| **Notifications**      | react-hot-toast / sonner                                       |
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
2. First-time login triggers face scan capture using **face-api.js**.
3. Events and attendance data are fetched dynamically from the backend.
4. Admins perform event and user management via protected dashboards.

---

## 🔐 Authentication Flow

**Login → Face Enrollment → Access App**

1. On login, users receive an **access token** and **refresh token**.
2. Tokens are securely stored using encrypted local storage.
3. First-time users are prompted to **register their face**.
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
├── public/                     # Static assets
│
├── src/
│   ├── api/                    # API interaction modules
│   ├── assets/                 # Images, icons, static files
│   ├── components/             # UI components (attendance, dashboard, event, users, etc.)
│   ├── context/                # React context providers (AuthContext)
│   ├── hooks/                  # Custom React hooks (useAuth, useEvent, etc.)
│   ├── lib/                    # Core utilities (ErrorBoundary, encryption, face auth)
│   ├── pages/                  # Route-level pages
│   ├── routes/                 # App routing and protected route definitions
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
VITE_STORAGE_ENCRYPTION_KEY="your encryption key"
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

## 🖼️ Screenshots

| View                | Screenshot                                            |
| ------------------- | ----------------------------------------------------- |
| **Login Page**      | ![Login Page](./screenshots/login.png)                |
| **Face Scan**       | ![Face Scan](./screenshots/face-scan.png)             |
| **User Dashboard**  | ![User Dashboard](./screenshots/dashboard.png)        |
| **Admin Dashboard** | ![Admin Dashboard](./screenshots/admin-dashboard.png) |
| **Attendance List** | ![Attendance List](./screenshots/attendance.png)      |

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


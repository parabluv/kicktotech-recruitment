# ⚡ KICK TO TECH — Recruitment & Interview Portal (Monday, 19th October)

A full-stack recruitment portal built with the **Playful Geometric** design system for the **KICK TO TECH** hiring drive on **Monday, 19th October**.

---

## 🔒 Security Audit & Hardening Report

The application has been audited and secured against major web application vulnerabilities (OWASP Top 10):

| Category | Potential Threat | Defensive Implementation |
| :--- | :--- | :--- |
| **Authentication** | Plaintext passcode leak / brute-force | Passcodes are hashed with **bcrypt (salt rounds = 10)**. Verification uses timing-attack-resistant comparison. |
| **Brute-Force & Flooding** | Credential stuffing / spam submissions | **Rate limiting** via `express-rate-limit`:<br>• Admin login: max 6 attempts / 15 min per IP<br>• Candidate submission: max 8 submissions / 15 min per IP<br>• Global API: max 300 requests / 15 min |
| **HTTP Security Headers** | Clickjacking / MIME-sniffing / XSS | **Helmet** enabled with strict Content-Security-Policy (CSP), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and Express `X-Powered-By` hidden. |
| **Stored XSS** | Malicious URLs (e.g. `javascript:alert()`) | Portfolio links are strictly validated to allow only `http://` or `https://` schemes. Text fields are sanitized against control characters and length-constrained. |
| **CSV / Formula Injection** | Malicious Excel macros (`=cmd...`) | Exported CSV cells starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `|`) are automatically sanitized with leading single quotes (`'`) to prevent execution in Excel/Sheets. |
| **Denial of Service (DoS)** | Memory exhaustion from oversized bodies | Strict JSON request body limit of **50KB** (`express.json({ limit: '50kb' })`). |
| **Mass Assignment** | Unauthorized status/rating tampering | Submission endpoint explicitly extracts only candidate inputs; review statuses (`Pending`) and ratings (`0`) are assigned server-side. |
| **Authorization / IDOR** | Unauthorized access to candidate records | All `/api/admin/*` routes require a signed JWT token verifying that the email is currently in the authorized admin whitelist. Primary account `parabluv25@gmail.com` cannot be removed. |
| **Dependency Audit** | Known library CVEs | Both root and client packages pass `npm audit` with **0 vulnerabilities**. |

---

## 🌟 Features Overview

### 1. 📝 Candidate Application Portal
- **8 Open Positions**:
  - 📱 **Social Media**
  - ✍️ **Content Creation**
  - 💻 **Web Team**
  - ⚙️ **Technical Team**
  - 🤝 **Partnership & Collaboration**
  - 🎨 **Graphic / Poster Designer**
  - 🎬 **Video Editor**
  - 🎤 **Event Management (Manager & Team)**
- **Candidate Fields**: Name, College, Program, Class/Year, Contact (WhatsApp formatted), Gmail, Post, Portfolio Link, Skills, Availability for Monday 19th Oct, and Reason to apply.
- **Visual Design**: Playful Geometric aesthetic (Memphis styling, candy buttons, hard pop drop shadows, Outfit & Plus Jakarta Sans typography, confetti receipt).

### 2. 🔐 Authorized Admin Panel (`/#admin`)
- Restricted access with **`parabluv25@gmail.com`** as permanent Super Admin.
- Dedicated tab to whitelist other team members' email addresses.
- Candidate sorting, filtering, and real-time KPI stats.
- 1-click **WhatsApp Chat** & **Email**.
- Evaluator notes & interview time-slot scheduler for Monday 19th October.
- **📥 Download CSV**: Full Excel export with formula injection defense.
- **🖨️ Printable Interview Roster**: Live cheat sheet for interview panels.

---

## 🚀 Deployment Instructions

### Environment Variables (Optional for Production):
Create a `.env` file in the root directory:
```env
PORT=5000
JWT_SECRET=your-custom-production-crypto-secret-key-min-32-chars
ALLOWED_ORIGIN=https://yourdomain.com
```

### Build & Run:
```powershell
# 1. Install dependencies
npm install
cd client && npm install && npm run build && cd ..

# 2. Start the production server
npm start
```

- **Candidate Portal**: `http://localhost:5000`
- **Admin Panel**: `http://localhost:5000/#admin`
- **Admin Email**: `parabluv25@gmail.com`
- **Default Passcode**: `admin19oct`

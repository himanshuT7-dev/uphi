# UPHI — Unified Patient Health Insight

UPHI is a modern, secure, and unified digital health ecosystem designed to streamline patient onboarding, longitudinal health record tracking, and secure consent-driven health data sharing. Built to align with the **Ayushman Bharat Digital Mission (ABDM)** standards and compliant with the **Digital Personal Data Protection (DPDP) Act**, UPHI bridges the gap between clinical management and patient privacy.

---

## 🚀 Key Features

* **Universal Login**: Multi-identifier login allows patients to authenticate securely using their ABHA ID, Email address, or Registered Phone Number.
* **ABDM-Compliant Onboarding**: Dedicated receptionist registry workflow to verify, create, and link patient profiles with verified ABHA addresses.
* **Consent-Driven Security**: A robust consent architecture ensuring doctors and clinics cannot query or view medical histories without active, time-bound, patient-approved consent agreements.
* **Longitudinal Clinical Timelines**: Automatic event tracking of consultations, prescriptions, lab tests, and hospital visits.
* **Cross-Platform Accessibility**: Real-time patient portal web interface, staff clinical portal web dashboard, and an Expo-based React Native mobile application.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Backend API** | Spring Boot, Spring Security (JWT), Spring Data MongoDB, OpenPDF, Java 17+ |
| **Web Frontend** | React, Vite, TailwindCSS, Axios |
| **Mobile App** | React Native, Expo, React Navigation, Axios |
| **Database** | MongoDB |

---

## 📦 Project Structure

```
UPHI_College/
├── uphi-backend/     # Spring Boot REST API
├── uphi-frontend/    # React SPA Web Application
├── uphi-mobile/      # Expo React Native App
├── .env.example      # Template for environment configurations
├── LICENSE           # MIT License
└── README.md         # Project documentation
```

---

## ⚙️ Getting Started & Setup

### 1. Prerequisites
Make sure you have the following installed on your machine:
* [Node.js (LTS)](https://nodejs.org/)
* [Java 17 JDK or higher](https://adoptium.net/)
* [MongoDB](https://www.mongodb.com/) (running on standard port `27017`)
* *Optional*: [Docker Desktop](https://www.docker.com/) (to run via containers)

### 2. Environment Configuration
Create a `.env` file in the project root directory and populate it with your local credentials. See `.env.example` for details:

```env
# JWT Security
JWT_SECRET=your-64-character-hmac-sha-secret-key-here
JWT_EXPIRATION=86400000

# Email SMTP Config (for OTP dispatch)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

---

## 🏃 Running the Application

### Option A: Manual Running (Development Mode)

#### A. Run Backend
1. Navigate to the backend directory:
   ```bash
   cd uphi-backend
   ```
2. Build and run:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The server will start on [http://localhost:8080](http://localhost:8080).*

#### B. Run Web Frontend
1. Navigate to the frontend directory:
   ```bash
   cd uphi-frontend
   ```
2. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```
   *The client will start on [http://localhost:5173](http://localhost:5173).*

#### C. Run Mobile App
1. Navigate to the mobile directory:
   ```bash
   cd uphi-mobile
   ```
2. Update `API_BASE` in `src/api.js` to match your local IP address.
3. Install dependencies and start the Metro Bundler:
   ```bash
   npm install
   npm run start
   ```
   *Scan the generated QR code using the Expo Go application on iOS or Android.*

---

### Option B: Running with Docker Compose
If you prefer running via Docker containerization:
```bash
docker-compose up --build
```
This automatically configures and links MongoDB, the backend server, and the web frontend container.

---

## 🔑 Demo Access Credentials

To test the UPHI platform, use the following pre-seeded demo accounts:

| Username | Password | Role / View |
| :--- | :--- | :--- |
| `admin` / `main_admin` | `admin123` | **Platform Administrator** (Manage hospitals & seed records) |
| `doctor` | `doctor123` | **Medical Practitioner** (Clinical view, enter records) |
| `receptionist` | `recep123` | **Front Desk Staff** (Patient onboarding, verify identities) |
| `Himanshu` | `Welcome@123` | **Platform Administrator** |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

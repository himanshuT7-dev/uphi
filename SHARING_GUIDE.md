# UPHI Project Sharing Guide (Mac to Windows)

This guide explains how to share and set up the **UPHI College** project on a Windows machine using the project's GitHub repository.

## 1. Repository Information
The project source code is available at:
**[https://github.com/himanshuT7-dev/uphi](https://github.com/himanshuT7-dev/uphi)**

## 2. Windows Prerequisites
Before setting up the project on Windows, ensure the following software is installed:
- **Git for Windows**: [Download here](https://git-scm.com/download/win)
- **Node.js (LTS)**: [Download here](https://nodejs.org/) (Required for Frontend)
- **Java 17 JDK**: [Download here (Eclipse Temurin)](https://adoptium.net/temurin/releases/?version=17) (Required for Backend)
- **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop) (Required for MongoDB)

## 3. Cloning the Project
On the Windows machine, open **PowerShell** or **Git Bash** and run:
```bash
git clone https://github.com/himanshuT7-dev/uphi
cd uphi
```

## 4. Environment Configuration
Environment files (`.env`) are not included in GitHub for security. You must manually create them:

### Backend Configuration
1. Navigate to `uphi-backend`.
2. Create a file named `.env` and copy the content from `.env.example`.
3. Fill in your secrets (JWT Secret, Email credentials, Gemini API Key).

### Frontend Configuration
The frontend connects to `http://localhost:8080` by default. No additional `.env` is typically required.

## 5. Running the Project

### Option A: Using Docker (Recommended)
This is the easiest way to run everything, including the database.
1. Open up a terminal in the root directory.
2. Run:
   ```bash
   docker-compose up --build
   ```

### Option B: Running Manually
#### Backend:
```bash
cd uphi-backend
./mvnw spring-boot:run
```
#### Frontend:
```bash
cd uphi-frontend
npm install
npm run dev
```

## 6. Cross-Platform Tips
- **Line Endings**: Windows uses `CRLF` while Mac uses `LF`. Git usually handles this automatically, but if you see errors, run `git config --global core.autocrlf true`.
- **Paths**: Always use relative paths or environment variables for file storage.

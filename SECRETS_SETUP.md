# UPHI Project Secrets & Keys Setup

This file provides details on the environment variables (secrets) required for the UPHI College project to function correctly. 

> [!WARNING]
> DO NOT commit these keys to GitHub. Keep them only in your local `.env` file. These keys have been identified from your backend `application.yml` and `.env.example`.

## 1. File Location
Create a file named **`.env`** in the **UPHI_College** root directory (where `docker-compose.yml` is located).

## 2. Required Setup (Backend)

| Key | Description | Example / Note |
| :--- | :--- | :--- |
| **JWT Config** | | |
| `JWT_SECRET` | Secret key for JWT token generation. | e.g. `your_64_char_base64_secret` |
| `JWT_EXPIRATION` | Token expiration time in milliseconds. | Default: `86400000` (24 hours). |
| **Email Config** | | |
| `MAIL_HOST` | SMTP server host for sending emails. | e.g. `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port. | e.g. `587` |
| `MAIL_USERNAME` | Email address from which to send notifications. | e.g. `uphi.fc@gmail.com` |
| `MAIL_PASSWORD` | App password (not regular login password) for your email. | e.g. `your_gmail_app_password` |
| **AI (Gemini) Config** | | |
| `GEMINI_API_KEY` | API key for Google Gemini AI features. | Get it from [Google AI Studio](https://aistudio.google.com/). |
| **Twilio Config** | | |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID. | Starts with `ACXXXXXXXX...` |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token. | |
| `TWILIO_FROM_NUMBER` | Your Twilio virtual phone number. | e.g. `+1234567890` |
| **MongoDB Config** | | |
| `SPRING_DATA_MONGODB_URI`| Database URI (if running manual/local). | Default (Docker): `mongodb://mongodb:27017/uphidb` |

## 3. How to Apply
1. Open the project in your IDE.
2. In the root directory, create a new file named `.env`.
3. Copy the values above into that file.
4. When you run `docker-compose up`, these keys will be automatically used by the system.

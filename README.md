# Dooper AI Symptom Checker & Specialty Finder

An AI-powered Symptom Checker web application that allows users to securely register and log in, describe their symptoms, receive a structured possible condition assessment, determine symptom severity level, find the recommended medical specialty, and ask follow-up questions to an AI clinical assistant.

This application replicates the modern, premium visual design language of the **Dooper** healthcare portal, using a custom Montserrat font, curated colors (Dooper Crimson Red `#E40443`), glassmorphic shadows, transitions, and support for a native Dark Mode.

---

## 🚀 Tech Stack

### Frontend (Client)
- **Framework**: React.js (built with Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **API Client**: Axios (configured with automated JWT authorization interceptors)
- **PDF Generation**: jsPDF (for generating medical report cards)

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Auth**: JSON Web Tokens (JWT) & bcryptjs (password hashing)
- **AI Integration**: OpenRouter API (Smart failover between `google/gemini-2.5-flash` and `meta-llama/llama-3.3-70b-instruct`)
- **Emergency / Failover Safety**: Local Clinical Fallback Engine (runs local symptom regex parsing if API limits or credentials fail)

---

## 🛠️ Features

1. **Fully Functional Authentication Module**
   - Register: Full Name, Email, Password, Confirm Password, form validation, and real-time password strength checker.
   - Login: JWT authentication, secure protected routes on the frontend, and profile updates.
2. **Interactive Dashboard**
   - Welcome Card greeting the user by name with customized time-of-day warnings.
   - Simple, step-by-step description instructions.
   - Comprehensive history log of past checks.
3. **AI Symptom Checker**
   - Inputs: Symptoms Description, Age, Gender, Symptom Duration, and Optional Existing Conditions.
   - Response Language support: Select output language (English, Hindi, Spanish, French, German, Arabic) and have the AI translate the diagnostic summaries and self-care advice seamlessly.
4. **Clinical Health Assessments**
   - Possible Condition names with detailed 2-3 line explanations.
   - Color-coded Severity Badges: **Mild** (Green), **Moderate** (Yellow), and **Severe** (Red).
   - Recommended Medical Specialties (General Physician, Cardiologist, Dermatologist, Neurologist, etc.).
   - Actionable self-care suggestions and clear medical liability disclaimers.
5. **Interactive AI Follow-up Chat**
   - Chat box inside the assessment details page allows the user to ask follow-up questions contextually bound to their specific symptom check.
6. **Assessment History with Search & Filter**
   - Filter history by keyword search (matching symptoms or conditions).
   - Filter by severity (Mild, Moderate, Severe).
   - Filter by date range (Today, Last 7 days, Last 30 days).
7. **Download Assessment as PDF**
   - Generates and downloads a clinical-style branded PDF containing patient metadata, symptom report, condition explanation, specialty, and a medical disclaimer.
8. **Dark Mode**
   - System-synchronized or manual light/dark toggle.

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
Create a `.env` file inside the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_signing_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Frontend (`client/.env`)
Create a `.env` file inside the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 Local Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the repository
```bash
git clone <repository-link>
cd aisymptonchecker
```

### 2. Set up Backend
```bash
cd server
npm install
# Configure your .env file
npm start
```
The server will start running on [http://localhost:5000](http://localhost:5000).

### 3. Set up Frontend
Open a new terminal window:
```bash
cd client
npm install
# Configure your .env file
npm run dev
```
The frontend application will be running on [http://localhost:5173](http://localhost:5173).

---

## ☁️ Deployment Instructions

### Deploying the Backend (Node.js/Express) to Render
1. Sign up on [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Go to the **Environment** tab and add the environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `OPENROUTER_API_KEY`
   - `PORT` = `5000`
6. Click **Deploy**. Copy the generated URL (e.g., `https://aisymptonchecker-backend.onrender.com`).

### Deploying the Frontend (Vite/React) to Vercel
1. Sign up on [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   - `VITE_API_URL` = `https://aisymptonchecker-backend.onrender.com/api` (use your actual Render backend URL)
6. Click **Deploy**.

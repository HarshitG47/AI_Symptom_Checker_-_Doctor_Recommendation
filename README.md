# Dooper — AI Symptom Checker & Specialty Finder

This is a health-focused web application that helps you describe your symptoms, chat with an AI assistant, and find out which type of doctor you should see. It searches the U.S. National Library of Medicine (MedlinePlus) in real time to back its analysis with trusted medical information, and hands you a downloadable report at the end.

> ⚠️ **Medical Disclaimer:** This is not a replacement for a real doctor. All results are AI-generated and for informational guidance only. Always consult a licensed healthcare professional for medical advice.

---

## What the App Does — Step by Step

### 1. Create an Account & Log In
- Register with your name, email, and password. Passwords are hashed with bcrypt — never stored in plain text.
- Your account saves every health assessment you've ever started, so you can come back and review them at any time.
- Sessions use secure JWT tokens. If your token expires while you are using the app, it automatically logs you out and takes you to the login page — no silent failures.

---

### 2. Fill Out the Symptom Form
On the dashboard you fill out a short form before the AI chat starts:

| Field | What it does |
|---|---|
| **Primary Symptoms** | Pick from a checklist of common symptoms (e.g. headache, chest pain, fever). |
| **Additional Details** | A free-text box — describe exactly how you feel in your own words. The AI reads this too. |
| **Duration** | How long you've had the symptoms (e.g. 2 days, 1 week). |
| **Age & Gender** | Helps the AI personalise its analysis. |
| **Medical Report Upload** | Upload a PDF or TXT file (max 5MB, enforced on the server). The AI reads the file and includes it as part of the consultation context. Only PDF and TXT formats are accepted — anything else is blocked. |

A **"Skip Q&A and compile report"** button is available at any point during the consultation. If you have already answered some questions, those answers are saved and carried over — you won't lose them. The AI uses whatever information it has collected so far to generate your report immediately.

---

### 3. AI Consultation Chat (5 Turns)
Submitting the form opens a private chat session with the AI:

- The AI asks targeted follow-up questions to narrow down your condition.
- You have **up to 5 turns** (5 exchanges back and forth). This keeps the consultation focused.
- **Every time the AI replies**, it automatically picks out 2–4 medical keywords from your messages, uploaded file, and symptom form (e.g. "shortness of breath", "chest tightness") and searches MedlinePlus with them in real time. The results are fed back into the AI before it answers, so its responses are grounded in verified medical content — not just the model's training data alone.
- If you report very serious symptoms (such as chest pain or difficulty breathing), a **red emergency warning banner** appears immediately and advises you to seek emergency help.

---

### 4. Your Assessment Report
Once the chat is done, a full health report is generated. Here is everything it contains:

#### Possible Conditions
A ranked list of up to 5 conditions that could match your symptoms, each shown with a percentage likelihood (e.g. "Tension Headache — 55%").

#### Severity Level
The AI classifies your situation as:
- 🟢 **Mild** — manageable at home with rest and over-the-counter remedies.
- 🟡 **Moderate** — you should book a doctor's appointment within a few days.
- 🔴 **Severe** — seek medical attention as soon as possible.

#### Recommended Specialist
The AI tells you which type of doctor to see (e.g. Cardiologist, Neurologist, General Practitioner) and briefly explains why.

#### Health Advice
Safe, general home-care tips relevant to your symptoms — things like hydration advice, rest, and warning signs to watch for.

#### AI Knowledge Base Queries — Transparency Card
At the bottom of every report, a blue card shows every medical keyword the AI searched in MedlinePlus during your consultation. This lets you see exactly what real medical sources were used to form the assessment, making the process transparent and auditable.

> If you ever open a report link before the consultation is finished (e.g. you bookmarked it mid-chat), you are automatically redirected back to the active chat session instead of seeing a blank or broken report page.

---

### 5. Follow-up Chat
After your report is ready, a follow-up chat box appears on the report page:

- Ask any further questions about your results 
- The AI answers in the full context of your specific report.
- You have up to 10 messages in the follow-up session. A live counter badge in the top-right corner of the chat box shows exactly how many messages you have left (e.g. "8 left"). The badge turns amber at 3 remaining and red when the limit is hit.
- When the limit is reached, the input box is replaced with a clear message prompting you to start a new assessment.

---

### 6. Download Your Report as PDF
A **Download PDF** button on the report page generates a clean, branded PDF of your full assessment — conditions, severity, specialist recommendation, and health advice included. Print it or share it directly with your doctor.

---

### 7. Assessment History
The History tab shows all your past assessments as cards. You can:
- Search by symptom or condition name.
- Filter by severity level (Mild / Moderate / Severe).
- Click any past assessment to read the full report again.



---

## Pages in the App

| Page | What it is |
|---|---|
| `/` — Home | Landing page with an app overview and a "Get Started" button. |
| `/register` | Create a new account. |
| `/login` | Log in to your existing account. |
| `/dashboard` | Main page — fill out the symptom form and view your assessment history. |
| `/consultation/:id` | The live AI chat session for a specific assessment. |
| `/assessment/:id` | The completed report page for a finished assessment. |
| `/history` | Full list of all your past assessments with search and filter. |
| `/profile` | View and edit your account details. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, CSS (custom Dooper design system) |
| **UI Icons** | Lucide React |
| **PDF Generation** | jsPDF |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Authentication** | JSON Web Tokens (JWT), bcrypt password hashing |
| **AI Engine** | OpenRouter API (Claude Sonnet 3.5 model) |
| **Medical Database** | MedlinePlus Connect API (U.S. National Library of Medicine) |
| **File Uploads** | Multer (PDF & TXT only, 5MB server-side limit) |

---

## Setup on Your Computer

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 1. Download the Project
```bash
git clone <repository-link>
cd aisymptonchecker
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm start
```
The server will run at `http://localhost:5000`.

### 3. Start the Frontend App
Open a **new terminal window**:
```bash
cd client
npm install
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## Environment Variables

### Backend — create `server/.env`
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_secret_string
OPENROUTER_API_KEY=your_openrouter_api_key
```

- **MONGODB_URI** — get a free database at [mongodb.com/atlas](https://www.mongodb.com/atlas).
- **OPENROUTER_API_KEY** — get a free key at [openrouter.ai](https://openrouter.ai/).

### Frontend — create `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Deploying Online

### Backend on Render (free tier)
1. Create a free account on [Render](https://render.com/).
2. Click **New → Web Service** and connect your GitHub repo.
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Add your environment variables in the **Environment** tab.
5. Deploy and copy the URL Render gives you.

### Frontend on Vercel (free tier)
1. Create a free account on [Vercel](https://vercel.com/).
2. Import your GitHub repository.
3. Set:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add an environment variable: `VITE_API_URL` = `https://your-render-url.onrender.com/api`
5. Deploy.

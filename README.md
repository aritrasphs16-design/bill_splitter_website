<div align="center">
  <img src="public/preview1.png" alt="SplitEasy App Interface" width="800">
  
  <br />
  <br />

  # 💸 SplitEasy v3.0

  **The ultimate modern ledger for shared expenses, group trips, and financial harmony.**
  <br />

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)](https://www.framer.com/motion/)

</div>

---

## ✨ Overview

**SplitEasy** takes the headache out of tracking shared expenses. Built from the ground up for modern travelers and roommates, SplitEasy replaces chaotic manual spreadsheets with an intelligent, automated financial ledger. 

With real-time multi-currency conversions, smart settlement algorithms, and one-click group access, it guarantees that everyone's financial records are perfectly synchronized and that debts are settled efficiently.

## 🚀 Key Features

- **📊 Beautiful Spending Analytics:** Visualize your group's spending habits with interactive, colorful donut charts tracking every category.
- **⚡ Smart Settlements:** Our advanced algorithm minimizes the total number of transactions needed to settle all debts within a group. No more complicated overlapping IOUs.
- **🌍 Multi-Currency Support:** Traveling abroad? Add expenses in any currency and SplitEasy handles the exact, real-time conversions instantly.
- **💳 Quick UPI Integration:** Settle debts seamlessly. Add your UPI ID so friends can tap and pay you back directly from their banking apps.
- **🔔 Smart Nudges:** Automated email notifications gently remind friends to settle up, avoiding awkward conversations.
- **🤝 Instant Group Access:** Generate a unique 6-digit access code for your trip and let anyone join instantly from their phone. No clunky onboarding required.
- **📄 Professional PDF Export:** Download highly professional PDF reports summarizing total trip expenditures and individual balances.

## 🛠️ Tech Stack

SplitEasy is built using a modern, scalable, and highly responsive technology stack:

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion for buttery-smooth animations.
- **Backend:** Next.js Server Actions & API Routes.
- **Authentication:** Supabase Auth (Secure Email/Password and OAuth).
- **Database:** MongoDB Atlas (Mongoose ORM).
- **Styling:** Custom CSS Custom Properties (`globals.css`), Lucide Icons, and Glassmorphism aesthetics.
- **Exporting:** jsPDF and jsPDF-AutoTable for dynamic document generation.

## 💻 Getting Started Locally

To run SplitEasy locally, you will need Node.js installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/aritrasphs16-design/bill_splitter_website.git
cd bill_splitter_website
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root of your project and populate it with your API keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MONGODB_URI=your_mongodb_connection_string
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ☁️ Deployment

This project is fully optimized for deployment on **Vercel**. 
When deploying, ensure that your `Environment Variables` are properly configured in your Vercel Project Settings and that your MongoDB IP Access List is set to allow connections from `0.0.0.0/0`.

---
<div align="center">
  <i>Built with ❤️ for financial peace of mind.</i>
</div>

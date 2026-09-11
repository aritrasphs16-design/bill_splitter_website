# SplitEasy v3.0 - Setup & Usage Instructions

Welcome to SplitEasy! This guide provides comprehensive, step-by-step instructions on how to set up the project locally, configure the necessary third-party services, and use the application.

---

## 🛠️ Part 1: Local Project Setup

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (Node Package Manager) or **yarn**
- **Git**

### 1. Clone the Repository
Open your terminal and run the following command to clone the project to your local machine:
```bash
git clone https://github.com/aritrasphs16-design/bill_splitter_website.git
cd bill_splitter_website
```

### 2. Install Dependencies
Install all required npm packages by running:
```bash
npm install
```
*(This will install Next.js, React, Tailwind CSS, Mongoose, Supabase client, and all other necessary libraries).*

---

## 🔑 Part 2: Environment Variables Configuration

SplitEasy relies on two external services to function: **MongoDB** (for the database) and **Supabase** (for authentication). You must set these up to run the app.

### 1. Create the Environment File
In the root directory of the project, create a file named exactly:
`.env.local`

### 2. Get Supabase Keys (Authentication)
1. Go to [Supabase](https://supabase.com/) and create a free account/project.
2. Once your project is created, navigate to **Project Settings** (the gear icon) > **API**.
3. Copy your `Project URL` and `anon public key`.
4. Add them to your `.env.local` file like this:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Get MongoDB URI (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2. Under **Network Access** in the left sidebar, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`). *(This ensures your app can connect).*
3. Under **Database Access**, create a new database user and remember the password.
4. Go to **Database** > **Connect** > **Connect your application**.
5. Copy the connection string and add it to your `.env.local` file:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bill_splitter?retryWrites=true&w=majority
```
*(Make sure to replace `<username>` and `<password>` with the credentials you just created).*

---

## 🚀 Part 3: Running the Application

Once your `.env.local` file is saved with the correct keys, you can start the development server:

```bash
npm run dev
```

Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

## 📖 Part 4: Usage Guide (How to use the app)

### 1. Authentication
- Click **"Start Splitting Free"** on the landing page.
- Sign up for a new account. *(Note: If using email/password, Supabase requires you to verify your email. For testing purposes, you can disable "Confirm Email" in your Supabase Auth settings, or use the Google OAuth option if configured).*
- Upon logging in, you will be redirected to your personal **Dashboard**.

### 2. Creating a Group
- Navigate to the **Groups** tab in the sidebar.
- Click **"Create Group"**. Give your trip/group a name (e.g., "Bali Trip 2026").
- A unique 6-digit **Join Code** will be generated.
- Share this 6-digit code with your friends. They can enter it on their own dashboard to instantly join your group.

### 3. Adding Expenses
- Inside a group, click **"Add Expense"**.
- Enter the description, the total amount, and the currency (e.g., USD, EUR, INR).
- SplitEasy will automatically convert the amount to a standardized base currency in real-time.
- Choose how to split the bill (Equally or Custom Amounts) among the group members.

### 4. Smart Settlements
- Navigate to the **Balances** or **Settlements** tab within the group.
- SplitEasy uses a **Graph Algorithm** to calculate the absolute minimum number of transactions required for everyone to be paid back.
- If John owes Mary $10, and Mary owes Peter $10, SplitEasy will simply tell John to pay Peter $10.
- You can mark debts as "Settled" once a payment is made (e.g., via UPI or Cash).

### 5. Exporting Reports
- Need a hard copy? Click the **"Download Report"** button.
- The app will generate a highly professional, formatted PDF document detailing all group expenses, individual spending, and final settlement balances.

---
*If you encounter any issues during setup, ensure your MongoDB IP whitelist is configured correctly and that your Supabase URL does not contain trailing slashes.*

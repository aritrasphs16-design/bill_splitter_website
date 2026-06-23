# 🏝️ CruiseSplit (Bill Splitter)

CruiseSplit is a modern, responsive web application designed to take the headache out of splitting expenses on group trips. Whether you're on a Caribbean Cruise, backpacking across Europe, or just managing weekend getaway costs with friends, CruiseSplit automatically tracks your shared expenses, calculates fair shares, and uses a **Minimum Transaction Settlement Algorithm** so you know exactly who owes who, with the absolute fewest number of transfers required.

## 🚀 Key Features

*   **Captain's Dashboard**: A high-level overview of your total spent, active fleets (groups), and exactly how much you owe or are owed.
*   **Personal Manifest**: Log and categorize your personal daily expenses (Food, Drinks, Activities, Shopping).
*   **Shared Fleets (Groups)**: Create trips and invite crew members.
*   **Smart Settlements**: Add shared group expenses and let the app calculate the net balances. The algorithm ensures everyone gets squared away with the minimum number of transactions possible!
*   **Authentication**: Secure signup and login powered by Supabase.

## 🛠️ Technology Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Styling:** Tailwind CSS v4 (with custom CSS variables for a premium, nautical glassmorphism aesthetic)
*   **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security)
*   **Icons:** Google Material Symbols

## 💻 Running Locally

To run this project on your local machine, you'll need Node.js installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aritrasphs16-design/bill_splitter_website.git
    cd bill_splitter_website
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    Execute the SQL commands found in `database/schema.sql` within your Supabase SQL Editor to instantly generate the tables, triggers, and Row Level Security (RLS) policies.

5.  **Start the development server:**
    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## 🚢 Deployment

This application is optimized for deployment on [Vercel](https://vercel.com/). 
When deploying, ensure you add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Vercel Environment Variables. Finally, remember to add your live Vercel URL to your Supabase Authentication Site URL settings.

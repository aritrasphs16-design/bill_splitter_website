# 🏝️ CruiseSplit (Bill Splitter)

CruiseSplit is a modern, responsive web application designed to take the headache out of splitting expenses on group trips. Whether you're on a Caribbean Cruise, backpacking across Europe, or just managing weekend getaway costs with friends, CruiseSplit automatically tracks your shared expenses, calculates fair shares, and uses a **Minimum Transaction Settlement Algorithm** so you know exactly who owes who, with the absolute fewest number of transfers required.

## 🚀 Key Features

*   **Captain's Dashboard**: A high-level overview of your total spent, active fleets (groups), and exactly how much you owe or are owed.
*   **Personal Manifest**: Log and categorize your personal daily expenses. Features interactive Donut Charts for spending analytics and a dynamic Monthly Budget tracker that changes color as you approach your limit.
*   **Shared Fleets (Groups)**: Create trips and invite crew members.
*   **Smart Settlements**: Add shared group expenses and let the app calculate the net balances. The algorithm ensures everyone gets squared away with the minimum number of transactions possible!
*   **Custom Splits**: Not everything is split equally! Support for splitting by Exact Amounts or Percentages.
*   **Multi-Currency Support**: Traveling internationally? Enter expenses in USD, EUR, GBP, etc., and let the app instantly convert it to your base currency using real-time rates from the Frankfurter API!
*   **100% Financial Transparency (Audit Trail)**: A detailed, chronological Timeline logs every action in the group—from members joining to expenses added and debts settled.
*   **Settle Up with UPI**: Easily pay your friends using automatically generated UPI QR codes straight from the app!
*   **Live Discussions**: Built-in real-time group chat so you can discuss expenses and coordinate plans seamlessly.
*   **Authentication**: Secure signup and login powered by Supabase.
*   **Live Weather & Clock Widget**: A nifty dashboard addition that grabs the current weather for your location and displays the real-time local clock.

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

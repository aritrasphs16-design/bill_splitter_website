import Link from "next/link";
import { Wallet, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="font-[family-name:var(--font-jakarta)] min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[var(--color-primary)] hover:opacity-80 transition-opacity">
            <Wallet className="w-8 h-8" />
            <span className="font-display-md text-2xl font-bold tracking-tight">SplitEasy</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 font-label-md text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display-lg text-4xl md:text-5xl font-extrabold text-[var(--color-on-surface)] mb-8">
          Privacy Policy
        </h1>
        
        <div className="space-y-8 font-body-lg text-[var(--color-on-surface-variant)] leading-relaxed">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">1. Our Commitment to Privacy</h2>
            <p>
              Welcome to SplitEasy! We believe your financial data should remain entirely private. This Privacy Policy explains how we collect, use, and protect your information when you use our platform to manage your shared expenses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">2. What We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Info:</strong> Your name and email to verify your identity and manage your account.</li>
              <li><strong>Expense Data:</strong> The bills you log, the groups you create, and the settlement balances.</li>
              <li><strong>Cookies:</strong> Essential session cookies to keep you securely logged in while using the application.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">3. How We Use Your Data</h2>
            <p>
              We only use your data to provide the core SplitEasy services. That means calculating who owes whom, displaying your personal budget analytics, and keeping your group ledgers synchronized. We do <strong>not</strong> sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">4. Data Security</h2>
            <p>
              We utilize a dual-database architecture to ensure maximum security. <strong>Supabase</strong> handles all user authentication securely, relying on industry-standard encryption and modern authentication practices. Meanwhile, your actual application data (like groups, expenses, and balances) is securely stored in <strong>MongoDB Atlas</strong>, which utilizes advanced network isolation and data-at-rest encryption to keep your financial records safe from unauthorized access.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">5. Your Rights</h2>
            <p>
              You have the right to request a complete copy of your data or ask us to delete your account and all associated expenses at any time. Simply reach out to us and we will permanently delete your records.
            </p>
          </section>

          <section className="space-y-4 p-6 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-2xl border border-[var(--color-primary)]/20 mt-12">
            <h2 className="font-display-md text-xl font-bold mb-2">Contact Us</h2>
            <p className="text-sm opacity-90">
              If you have any questions about this Privacy Policy, please open an issue on our GitHub repository.
            </p>
          </section>
        </div>
      </main>

    </div>
  );
}

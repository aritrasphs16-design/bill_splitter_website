import Link from "next/link";
import { Anchor, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[var(--color-primary)] hover:opacity-80 transition-opacity">
            <Anchor className="w-8 h-8" />
            <span className="font-display-md text-2xl font-bold tracking-tight">CruiseSplit</span>
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
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">1. The Captain's Promise</h2>
            <p>
              Welcome aboard CruiseSplit! We believe that what happens on the trip, stays on the trip (especially how much you spent on those late-night snacks). This Privacy Policy explains how we collect, use, and protect your information when you sail with us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">2. What We Collect (The Cargo)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Info:</strong> Your name and email so we know who's steering the ship.</li>
              <li><strong>Expense Data:</strong> The bills you log, the groups you create, and the people you owe money to. (Don't worry, we won't judge your spending habits).</li>
              <li><strong>Cookies:</strong> Not the chocolate chip kind, sadly. Just the digital ones that keep you logged in so you don't have to enter your password every time you add an expense.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">3. How We Use It (Navigating the Waters)</h2>
            <p>
              We only use your data to make CruiseSplit work. That means calculating who owes who, displaying your beautiful analytics charts, and keeping your fleet synchronized. We do <strong>not</strong> sell your personal data to third parties. Your financial drama is yours alone.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">4. Security (Batten Down the Hatches)</h2>
            <p>
              We use Supabase (a top-tier Backend-as-a-Service) to store your data securely. While no ship is 100% unsinkable (looking at you, Titanic), we use industry-standard encryption and security practices to keep your data safe from pirates and hackers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display-md text-2xl font-bold text-[var(--color-on-surface)]">5. Your Rights (Mutiny Options)</h2>
            <p>
              You have the right to request a copy of your data or ask us to delete your account and all associated expenses. Just drop us a line and we'll toss your records overboard.
            </p>
          </section>

          <section className="space-y-4 p-6 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-2xl border border-[var(--color-primary)]/20 mt-12">
            <h2 className="font-display-md text-xl font-bold mb-2">Contact the Captain</h2>
            <p className="text-sm opacity-90">
              If you have any questions about this Privacy Policy, please open an issue on our GitHub repository. Safe travels!
            </p>
          </section>
        </div>
      </main>

    </div>
  );
}

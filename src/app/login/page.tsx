"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard/expenses");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard/expenses`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex w-full flex-1 items-center justify-center p-container-padding relative overflow-hidden">
      {/* Decorative Wave Background Elements */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-tertiary-fixed-dim via-error-container to-primary-fixed-dim opacity-60"></div>
      <div 
        className="absolute inset-0 z-0 bg-cover bg-bottom opacity-20 mix-blend-multiply" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBkbAsEuO_FcqihzZO5uVbCG2kRe1S8j0hOkcidw_mPrPx4DQCwP5uxlDep9TmbUqmACLUq-2xA6KJr97TSKq5BKX8bA9_kYph_N_fgtsATGpwaPL4crVP7rMQKPYSNmzJD76kcgIrbhCB1J4T6Ic-hxf7mRg1sNnaSFznMCDV4o_QX1jqQuNSxBxzJEDkIlXIw6bnBM7miRnClNF7ltYT9GUurESzfz8zJ-IRiqL8iWeDhhe02ZqF5FFyE_ZcFLkGy7GloLJPh__4')" }}
      ></div>
      
      {/* Main Login Card */}
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0_24px_64px_rgba(3,4,94,0.15)] z-10 relative overflow-hidden p-8 border border-surface-container-highest">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4 shadow-sm">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_boat</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Welcome Aboard <span className="inline-block align-middle">⚓</span></h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Stow your gear and log in to manage your crew's ledger.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container rounded text-center text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="floating-label-group">
            <input 
              className="wave-input w-full bg-transparent border-0 px-0 py-2 font-label-md text-label-md text-on-surface placeholder-transparent" 
              id="email" 
              placeholder=" " 
              required 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <label className="floating-label font-label-md text-label-md text-on-surface-variant" htmlFor="email">Email Address</label>
          </div>
          
          <div className="floating-label-group relative">
            <input 
              className="wave-input w-full bg-transparent border-0 px-0 py-2 font-label-md text-label-md text-on-surface placeholder-transparent pr-10" 
              id="password" 
              placeholder=" " 
              required 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <label className="floating-label font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
            {/* Password Toggle */}
            <button 
              aria-label="Toggle password visibility" 
              className="absolute right-0 top-6 text-outline-variant hover:text-primary transition-colors focus:outline-none" 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined">
                {showPassword ? "visibility" : "visibility_off"}
              </span>
            </button>
          </div>
          
          {/* Actions */}
          <div className="pt-4 space-y-4">
            <button 
              className="ticket-btn w-full bg-tertiary-container hover:bg-tertiary text-on-tertiary-container font-label-md text-label-md py-4 px-6 rounded-lg shadow-sm transition-all active:translate-y-px flex items-center justify-center gap-2 border-l-2 border-r-2 border-dashed border-tertiary-fixed disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Logging In..." : "Log In"}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="flex-shrink-0 mx-4 text-on-surface-variant font-label-md text-sm">Or</span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-[#49454f] border border-[#E8E0D5] font-label-md py-3.5 px-6 rounded-xl shadow-sm hover:bg-[#F8F5F2] transition-colors flex items-center justify-center gap-3 font-medium"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            New to the crew? <br className="md:hidden" />
            <Link className="text-primary hover:text-secondary font-bold transition-colors inline-flex items-center gap-1 mt-1 md:mt-0" href="/signup">
              Sign up here <span className="inline-block">🌊</span>
            </Link>
          </p>
        </div>

        {/* GitHub Link */}
        <div className="mt-6 text-center border-t border-surface-container-highest pt-6">
          <a 
            href="https://github.com/aritrasphs16-design/bill_splitter_website" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-sm"
          >
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5 opacity-70" />
            View Source on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}

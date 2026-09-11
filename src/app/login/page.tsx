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
      router.push("/dashboard");
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
      {/* Background Decoration: Professional Soft Mesh Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#fecdd3] opacity-80"></div>
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-multiply" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')" }}
      ></div>
      
      {/* Main Login Card */}
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0_24px_64px_rgba(3,4,94,0.15)] z-10 relative overflow-hidden p-8 border border-surface-container-highest">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e0f2fe] text-[#00668c] mb-4 shadow-sm">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-slate-900 mb-2">Welcome Back</h1>
          <p className="font-body-md text-body-md text-slate-500">Log in to track your expenses and settle up.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container rounded text-center text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">Email Address</label>
            <input 
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00668c]/20 focus:border-[#00668c] transition-all placeholder:text-slate-400" 
              id="email" 
              placeholder="name@example.com" 
              required 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">Password</label>
            <div className="relative">
              <input 
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00668c]/20 focus:border-[#00668c] transition-all placeholder:text-slate-400 pr-12" 
                id="password" 
                placeholder="••••••••" 
                required 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                aria-label="Toggle password visibility" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 flex items-center justify-center" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-xl leading-none">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="pt-2 space-y-4">
            <button 
              className="w-full bg-[#00668c] hover:bg-[#005c7a] text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100" 
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
          <p className="font-body-md text-body-md text-slate-500">
            Don't have an account?{" "}
            <Link className="text-[#00668c] hover:text-[#005c7a] font-bold transition-colors inline-flex items-center gap-1 mt-1 md:mt-0" href="/signup">
              Sign up here
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

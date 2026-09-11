"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data?.user && data.session === null) {
      // Supabase requires email verification
      setSuccess("Account created successfully! Please check your email and click the verification link to activate your account. You will not be able to log in until your email is verified.");
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
      
      {/* Main Signup Card (Shipping Manifest / Boarding Pass Proportions) */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-[0_12px_48px_rgba(3,4,94,0.08)] animate-float backdrop-blur-sm border border-surface-container-high/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e0f2fe] text-[#00668c] mb-4 shadow-sm">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-slate-900">Create an Account</h1>
          <p className="font-body-md text-body-md text-slate-500 mt-2">Start splitting bills effortlessly with your friends.</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container rounded text-center text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-6 bg-tertiary-container/30 text-on-surface rounded-xl border border-tertiary/20 text-center shadow-inner animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary text-on-tertiary mb-4 shadow-md">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_unread</span>
            </div>
            <h3 className="font-title-lg text-title-lg text-primary mb-2">Verify Your Email</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {success}
            </p>
          </div>
        )}

        {!success && (
          <div className="mb-6 space-y-3">
            <div className="p-4 bg-error-container/40 text-on-surface rounded-lg border-l-4 border-error flex items-start gap-3">
              <span className="material-symbols-outlined text-error mt-0.5">warning</span>
              <div>
                <p className="font-label-md text-sm font-bold text-error mb-1">Strict Verification Required</p>
                <p className="font-body-md text-xs text-on-surface-variant">
                  You must use a valid email address. Unverified accounts will not be granted access to the platform.
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary-container/40 text-on-surface rounded-lg border-l-4 border-primary flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
              <div>
                <p className="font-label-md text-sm font-bold text-primary mb-1">Recommendation (Recommended)</p>
                <p className="font-body-md text-xs text-on-surface-variant">
                  This project is in active development. Supabase limits email verifications to <strong>3 per hour</strong>. We highly recommend signing up with <strong>Google</strong> to bypass this limit and avoid delays.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">person</span>
              <input 
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00668c]/20 focus:border-[#00668c] transition-all placeholder:text-slate-400" 
                id="fullName" 
                placeholder="Jane Doe" 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">mail</span>
              <input 
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00668c]/20 focus:border-[#00668c] transition-all placeholder:text-slate-400" 
                id="email" 
                placeholder="name@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">lock</span>
              <input 
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00668c]/20 focus:border-[#00668c] transition-all placeholder:text-slate-400" 
                id="password" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            {/* Password Strength Bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-2 h-1.5">
                  <div className={`flex-1 rounded-full ${password.length > 0 ? 'bg-red-400' : 'bg-slate-200'}`}></div>
                  <div className={`flex-1 rounded-full ${password.length >= 6 ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                  <div className={`flex-1 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1 text-right font-medium">
                  {password.length < 6 ? 'Weak' : password.length < 8 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}
          </div>
          
          {/* Primary Button */}
          <div className="pt-2 space-y-4">
            <button 
              type="submit"
              className="w-full bg-[#00668c] hover:bg-[#005c7a] text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
              disabled={loading}
            >
              <span>{loading ? "Joining..." : "Create Account"}</span>
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
              Sign up with Google
            </button>
          </div>
        </form>
        )}
        
        {/* Footer Link */}
        <div className="mt-6 text-center">
          <p className="font-body-md text-body-md text-slate-500">
            Already have an account?{" "}
            <Link className="font-label-md text-[#00668c] hover:text-[#005c7a] underline decoration-2 underline-offset-4 transition-colors" href="/login">
              Log in.
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
      </div>
    </div>
  );
}

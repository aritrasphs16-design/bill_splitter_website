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
      {/* Background Decoration: Tropical Sunset Gradient & Palms */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-tertiary-fixed-dim via-error-container to-primary-fixed-dim opacity-60"></div>
      <div 
        className="absolute inset-0 z-0 bg-cover bg-bottom opacity-20 mix-blend-multiply" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBkbAsEuO_FcqihzZO5uVbCG2kRe1S8j0hOkcidw_mPrPx4DQCwP5uxlDep9TmbUqmACLUq-2xA6KJr97TSKq5BKX8bA9_kYph_N_fgtsATGpwaPL4crVP7rMQKPYSNmzJD76kcgIrbhCB1J4T6Ic-hxf7mRg1sNnaSFznMCDV4o_QX1jqQuNSxBxzJEDkIlXIw6bnBM7miRnClNF7ltYT9GUurESzfz8zJ-IRiqL8iWeDhhe02ZqF5FFyE_ZcFLkGy7GloLJPh__4')" }}
      ></div>
      
      {/* Main Signup Card (Shipping Manifest / Boarding Pass Proportions) */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-[0_12px_48px_rgba(3,4,94,0.08)] animate-float backdrop-blur-sm border border-surface-container-high/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4 shadow-sm">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Join the Crew</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Set sail on your next shared adventure.</p>
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
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Full Name */}
          <div className="relative">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline px-2">person</span>
              <input 
                className="w-full bg-transparent border-0 input-wave pl-10 pr-4 py-2 font-body-md text-on-surface focus:ring-0 placeholder:text-outline-variant focus:outline-none" 
                id="fullName" 
                placeholder="Captain Stubing" 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Email */}
          <div className="relative">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="email">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline px-2">mail</span>
              <input 
                className="w-full bg-transparent border-0 input-wave pl-10 pr-4 py-2 font-body-md text-on-surface focus:ring-0 placeholder:text-outline-variant focus:outline-none" 
                id="email" 
                placeholder="captain@cruisesplit.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Password */}
          <div className="relative">
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1" htmlFor="password">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline px-2">lock</span>
              <input 
                className="w-full bg-transparent border-0 input-wave pl-10 pr-4 py-2 font-body-md text-on-surface focus:ring-0 placeholder:text-outline-variant focus:outline-none" 
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
            {/* Password Strength Bar Placeholder */}
            {password.length > 0 && (
              <>
                <div className="flex gap-2 h-1.5 mt-3">
                  <div className="flex-1 bg-tertiary rounded-full shadow-inner"></div>
                  <div className={`flex-1 rounded-full ${password.length >= 6 ? 'bg-surface-variant' : 'bg-transparent'}`}></div>
                  <div className={`flex-1 rounded-full ${password.length >= 8 ? 'bg-surface-variant' : 'bg-transparent'}`}></div>
                </div>
                <p className="font-caption text-caption text-on-surface-variant mt-1 text-right">
                  {password.length < 6 ? 'Weak' : password.length < 8 ? 'Medium' : 'Strong'}
                </p>
              </>
            )}
          </div>
          
          {/* Primary Button (Boarding Pass Style) */}
          <div className="space-y-4 mt-section-margin">
            <button 
              type="submit"
              className="relative w-full bg-tertiary text-on-tertiary font-title-md text-title-md py-4 px-6 rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group disabled:opacity-50"
              disabled={loading}
            >
              {/* Perforated Edge Detail */}
              <div className="absolute -left-2 top-0 bottom-0 w-4 flex flex-col justify-evenly py-2 opacity-80">
                <div className="w-3 h-3 bg-surface-container-lowest rounded-full"></div>
                <div className="w-3 h-3 bg-surface-container-lowest rounded-full"></div>
                <div className="w-3 h-3 bg-surface-container-lowest rounded-full"></div>
                <div className="w-3 h-3 bg-surface-container-lowest rounded-full"></div>
              </div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? "Joining..." : "Start Your Journey"}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </span>
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
          <p className="font-body-md text-body-md text-on-surface-variant">
            Already part of the crew?{" "}
            <Link className="font-label-md text-primary hover:text-secondary underline decoration-2 underline-offset-4 transition-colors" href="/login">
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

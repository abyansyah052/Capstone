import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TextInput, PasswordInput, Checkbox, Button } from "@mantine/core";
import { Eye, EyeOff } from "lucide-react";

type LoginPageProps = {
  onLoginSuccess: () => void;
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load email if remember me was previously checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("asisya_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rememberMe && email.trim()) {
      localStorage.setItem("asisya_remember_email", email);
    } else {
      localStorage.removeItem("asisya_remember_email");
    }

    let valid = true;
    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!valid) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 1200);

    /* ──── INSTANT BYPASS LOGIN CODE (COMMENTED OUT FOR FE TESTING) ────
    // Instant login for FE testing
    onLoginSuccess();
    */
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 800);

    /* ──── INSTANT BYPASS LOGIN CODE (COMMENTED OUT FOR FE TESTING) ────
    // Instant login for FE testing
    onLoginSuccess();
    */
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F4F6F9] p-4 lg:p-6 select-none font-sans overflow-hidden">
      {/* Left decorative panel (Hidden on mobile/tablet, shown on desktop) */}
      <div className="hidden lg:flex lg:w-[42%] relative rounded-[28px] overflow-hidden bg-black flex-col justify-between p-12">
        {/* Background Image overlayed with gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" 
          style={{ backgroundImage: "url('/src/assets/login_bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent mix-blend-multiply opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

        {/* Top Content */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-[10px] font-bold text-white/60 tracking-[0.2em] uppercase">
            A Wise Quote
          </span>
          <div className="h-px w-16 bg-white/20" />
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 flex flex-col gap-4">
          <h2 className="text-[42px] font-bold leading-[1.15] text-white tracking-tight max-w-[380px]">
            Get Everything You Want
          </h2>
          <p className="text-[13px] text-white/60 leading-relaxed font-normal max-w-[280px]">
            You can get everything you want if you work hard, trust the process, and stick to the plan.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full lg:w-[58%] bg-white rounded-3xl lg:rounded-none lg:bg-transparent flex flex-col justify-center items-center p-8 lg:p-12 overflow-y-auto"
      >
        <div className="w-full max-w-[400px] flex flex-col gap-10">
          {/* Top Header Logo */}
          <div className="flex justify-center items-center">
            <img src="/LogoAuth.png" alt="Asisya Logo" className="h-20 w-auto object-contain" />
          </div>

          {/* Main Form container */}
          <div className="w-full flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <h1 className="text-[30px] font-bold text-[#1C243B] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-[13px] text-[#6B7280] font-normal leading-relaxed">
                Enter your email and password to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1C243B]">Email</label>
                <TextInput
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.currentTarget.value);
                    if (emailError) setEmailError("");
                  }}
                  error={emailError || undefined}
                  styles={{
                    input: {
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                      height: "44px",
                      fontSize: "13px",
                      color: "#1C243B",
                      transition: "all 0.15s ease",
                      "&:focus": {
                        borderColor: "#1C243B",
                        borderWidth: "1px",
                        backgroundColor: "#ffffff",
                      }
                    }
                  }}
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1C243B]">Password</label>
                <PasswordInput
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.currentTarget.value);
                    if (passwordError) setPasswordError("");
                  }}
                  error={passwordError || undefined}
                  visibilityToggleIcon={({ reveal }) =>
                    reveal ? <EyeOff size={15} className="text-[#6B7280]" /> : <Eye size={15} className="text-[#6B7280]" />
                  }
                  styles={{
                    input: {
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                      height: "44px",
                      fontSize: "13px",
                      color: "#1C243B",
                      transition: "all 0.15s ease",
                      "&:focus": {
                        borderColor: "#1C243B",
                        borderWidth: "1px",
                        backgroundColor: "#ffffff",
                      }
                    },
                    innerInput: {
                      height: "42px",
                      fontSize: "13px",
                    },
                    visibilityToggle: {
                      "&:hover": {
                        backgroundColor: "transparent"
                      }
                    }
                  }}
                />
              </div>

              {/* Remember & Forgot Row */}
              <div className="flex items-center justify-between text-[13px] text-[#6B7280] mt-1">
                <Checkbox
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  styles={{
                    label: {
                      fontSize: "13px",
                      color: "#6B7280",
                      paddingLeft: "8px",
                    },
                    input: {
                      borderColor: "#cbd5e1",
                      "&:checked": {
                        backgroundColor: "#1C243B",
                        borderColor: "#1C243B",
                      }
                    }
                  }}
                />
                <a href="/forgot-password" onClick={(e) => e.preventDefault()} className="font-medium hover:text-[#1C243B] transition-colors">
                  Forgot Password
                </a>
              </div>

              {/* Sign In Button */}
              <motion.div whileTap={{ scale: 0.975 }} className="w-full mt-2">
                <Button
                  type="submit"
                  loading={isLoading}
                  styles={{
                    root: {
                      backgroundColor: "#1C243B",
                      borderRadius: "12px",
                      height: "45px",
                      width: "100%",
                      fontSize: "14px",
                      fontWeight: 600,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: "#2d3a55",
                      }
                    }
                  }}
                >
                  Sign In
                </Button>
              </motion.div>

              {/* Sign In With Google */}
              <motion.div whileTap={{ scale: 0.975 }} className="w-full">
                <Button
                  variant="default"
                  onClick={handleGoogleLogin}
                  loading={isLoading}
                  leftSection={
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                    </svg>
                  }
                  styles={{
                    root: {
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                      height: "45px",
                      width: "100%",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1C243B",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                      }
                    }
                  }}
                >
                  Sign In with Google
                </Button>
              </motion.div>
            </form>
          </div>

          {/* Bottom footer registration link */}
          <div className="text-center text-[13px] text-[#6B7280] font-normal">
            Don't have an account?{" "}
            <a href="/register" onClick={(e) => e.preventDefault()} className="font-bold text-[#1C243B] hover:underline">
              Sign Up
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

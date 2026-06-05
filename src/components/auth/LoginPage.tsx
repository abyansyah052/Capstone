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

    // Simulate login loading state
    setTimeout(() => {
      setIsLoading(false);
      if (rememberMe) {
        localStorage.setItem("asisya_remember_email", email);
      } else {
        localStorage.removeItem("asisya_remember_email");
      }
      onLoginSuccess();
    }, 1200);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 800);
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
          <h2 className="font-serif text-[42px] font-medium leading-[1.15] text-white tracking-tight max-w-[380px]">
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
        className="w-full lg:w-[58%] bg-white rounded-3xl lg:rounded-none lg:bg-transparent flex flex-col justify-between p-8 lg:p-12"
      >
        {/* Top Header Logo */}
        <div className="flex justify-center items-center gap-2.5">
          <img src="/asisya-consulting.png" alt="Asisya Logo" className="h-7 w-auto object-contain" />
          <span className="font-bold text-[19px] text-[#1C243B] tracking-tight">Asisya</span>
        </div>

        {/* Main Form container */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-8 flex flex-col gap-6">
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-[30px] font-serif font-bold text-[#1C243B] tracking-tight">
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
                onChange={(e) => setEmail(e.currentTarget.value)}
                error={emailError}
                styles={{
                  input: {
                    backgroundColor: "#F4F6F9",
                    border: emailError ? "1px solid var(--mantine-color-red-filled)" : "1px solid transparent",
                    borderRadius: "12px",
                    height: "44px",
                    fontSize: "13px",
                    color: "#1C243B",
                    transition: "all 0.15s ease",
                    "&:focus": {
                      borderColor: "#1C243B",
                      backgroundColor: "#ffffff",
                    }
                  },
                  error: {
                    fontSize: "11px",
                    marginTop: "3px"
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
                onChange={(e) => setPassword(e.currentTarget.value)}
                error={passwordError}
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <EyeOff size={15} className="text-[#6B7280]" /> : <Eye size={15} className="text-[#6B7280]" />
                }
                styles={{
                  input: {
                    backgroundColor: "#F4F6F9",
                    border: passwordError ? "1px solid var(--mantine-color-red-filled)" : "1px solid transparent",
                    borderRadius: "12px",
                    height: "44px",
                    fontSize: "13px",
                    color: "#1C243B",
                    transition: "all 0.15s ease",
                    "&:focus": {
                      borderColor: "#1C243B",
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
                  },
                  error: {
                    fontSize: "11px",
                    marginTop: "3px"
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
                    borderColor: "#e2e8f0",
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
                leftSection={
                  <svg className="h-[15px] w-[15px] mr-1" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.09 14.99 0 12 0 7.354 0 3.307 2.662 1.343 6.551l3.923 3.214z"
                    />
                    <path
                      fill="#4285F4"
                      d="M16.04 15.343c1.15-.982 1.8-2.436 1.8-4.343 0-.545-.045-1.054-.136-1.5h-5.7v3.272h3.3c-.136.728-.545 1.319-1.136 1.727v3.546h1.864l1.808-2.702z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.8-2.95c-1.12.75-2.54 1.2-4.13 1.2-3.18 0-5.88-2.15-6.84-5.04l-3.97 3.07C3.19 21.34 7.24 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.16 14.3c-.25-.75-.4-1.55-.4-2.38s.15-1.63.4-2.38L1.19 6.47A11.96 11.96 0 0 0 0 11.92c0 1.95.47 3.8 1.28 5.45l3.88-3.07z"
                    />
                  </svg>
                }
                styles={{
                  root: {
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
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
      </motion.div>
    </div>
  );
}

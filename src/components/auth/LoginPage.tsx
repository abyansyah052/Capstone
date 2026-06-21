import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TextInput, PasswordInput, Checkbox, Button } from "@mantine/core";
import { Eye, EyeOff } from "lucide-react";
import loginBg from "../../assets/Psikolog Asisya Web Design.png";

type LoginPageProps = {
  onLoginSuccess: (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    signature: string | null;
  }) => void;
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // Initialize Google OAuth2 Client
  useEffect(() => {
    console.log("Initializing Google OAuth SDK...");
    const initGoogleOAuth = () => {
      const g = (window as any).google;
      if (g?.accounts?.oauth2) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
        console.log("Google OAuth client ID in use:", clientId);
        try {
          const client = g.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope:
              "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
            callback: async (tokenResponse: any) => {
              console.log("Google OAuth token client response received:", tokenResponse);
              if (tokenResponse?.error) {
                console.error(
                  "Google OAuth authentication error:",
                  tokenResponse.error,
                  tokenResponse.error_description
                );
                alert(
                  `Google OAuth Error: ${tokenResponse.error_description || tokenResponse.error}`
                );
                setIsLoading(false);
                return;
              }
              if (tokenResponse && tokenResponse.access_token) {
                setIsLoading(true);
                try {
                  console.log("Sending Google access token to backend for secure verification...");
                  // Call backend API with Google access token
                  const res = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: tokenResponse.access_token }),
                  });
                  const json = await res.json();
                  setIsLoading(false);
                  console.log("Backend response for Google auth:", json);
                  if (json.ok) {
                    onLoginSuccess(json.data);
                  } else {
                    console.error("Backend rejected Google token:", json.error);
                    alert(json.error || "Gagal login Google");
                  }
                } catch (err) {
                  console.error("Failed verifying with backend:", err);
                  setIsLoading(false);
                  alert("Server Timeout / Google Timeout");
                }
              }
            },
          });
          setTokenClient(client);
          console.log("Google OAuth client initialized successfully.");
        } catch (initErr) {
          console.error("Failed to initialize Google OAuth token client:", initErr);
        }
      } else {
        console.warn("window.google.accounts.oauth2 is not available yet.");
      }
    };

    const g = (window as any).google;
    if (g?.accounts?.oauth2) {
      initGoogleOAuth();
    } else {
      console.log("Google client script not loaded yet; setting up listeners...");

      // Hook into Google Identity Services global load callback
      (window as any).onGoogleLibraryLoad = () => {
        console.log("onGoogleLibraryLoad callback triggered.");
        initGoogleOAuth();
      };

      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.oauth2) {
          console.log("Google client script detected via interval polling.");
          initGoogleOAuth();
          clearInterval(interval);
        }
      }, 500);

      return () => {
        clearInterval(interval);
        delete (window as any).onGoogleLibraryLoad;
      };
    }
  }, []);

  // Load email if remember me was previously checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("asisya_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUp && rememberMe && email.trim()) {
      localStorage.setItem("asisya_remember_email", email);
    } else if (!isSignUp) {
      localStorage.removeItem("asisya_remember_email");
    }

    let valid = true;

    if (isSignUp) {
      if (!name.trim()) {
        setNameError("Name is required");
        valid = false;
      } else {
        setNameError("");
      }
    }

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
    } else if (isSignUp && password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (isSignUp) {
      if (!confirmPassword) {
        setConfirmPasswordError("Confirm password is required");
        valid = false;
      } else if (confirmPassword !== password) {
        setConfirmPasswordError("Passwords do not match");
        valid = false;
      } else {
        setConfirmPasswordError("");
      }
    }

    if (!valid) return;

    setIsLoading(true);
    if (isSignUp) {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const json = await res.json();
        setIsLoading(false);
        if (json.ok) {
          onLoginSuccess(json.data);
        } else {
          setConfirmPasswordError(json.error || "Gagal mendaftar");
        }
      } catch (err: any) {
        setIsLoading(false);
        setConfirmPasswordError("Server Timeout.");
      }
    } else {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        setIsLoading(false);
        if (json.ok) {
          onLoginSuccess(json.data);
        } else {
          setPasswordError(json.error || "Gagal masuk");
        }
      } catch (err: any) {
        setIsLoading(false);
        setPasswordError("Server Timeout.");
      }
    }
  };

  const handleGoogleLogin = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      alert(
        "API Google Sign-in sedang memuat. Silakan tunggu sebentar atau pastikan koneksi internet aktif."
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F4F6F9] p-4 lg:p-6 select-none font-sans overflow-hidden">
      {/* Left decorative panel (Hidden on mobile/tablet, shown on desktop) */}
      <div className="hidden lg:flex lg:w-[48%] relative rounded-tl-[120px] rounded-br-[120px] rounded-tr-[28px] rounded-bl-[28px] overflow-hidden bg-black flex-col justify-between p-12">
        {/* Background Image overlayed with gradient */}
        <div
          className="absolute inset-0 bg-cover bg-bottom transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${loginBg})`, backgroundPosition: "bottom" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent mix-blend-multiply opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

        {/* Large SVG Branding Logo in bottom left */}
        <div className="relative z-10 mt-auto flex items-end justify-start">
          <img
            src="/SI Capstone 1 Group 2.svg"
            alt="SI Capstone 1 Group 2 Logo"
            className="w-full max-w-[340px] h-auto object-contain"
          />
        </div>
      </div>

      {/* Right form panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full lg:w-[52%] bg-white rounded-3xl lg:rounded-none lg:bg-transparent flex flex-col justify-center items-center p-8 lg:p-12 overflow-y-auto"
      >
        <div className="w-full max-w-[440px] flex flex-col gap-10">
          {/* Top Header Logo */}
          <div className="flex justify-center items-center">
            <img src="/LogoAuth.png" alt="Asisya Logo" className="h-32 w-auto object-contain" />
          </div>

          {/* Main Form container */}
          <div className="w-full flex flex-col gap-6">
            <div className="text-center flex flex-col gap-2">
              <h1 className="text-[30px] font-bold text-[#1C243B] tracking-tight">
                {isSignUp ? "Daftar Akun Baru" : "Welcome Back"}
              </h1>
              <p className="text-[13px] text-[#6B7280] font-normal leading-relaxed">
                {isSignUp
                  ? "Lengkapi formulir di bawah ini untuk membuat akun baru"
                  : "Enter your email and password to access your account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
              {/* Full Name Input (Register Only) */}
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1C243B]">Nama Lengkap</label>
                  <TextInput
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.currentTarget.value);
                      if (nameError) setNameError("");
                    }}
                    error={nameError || undefined}
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
                        },
                      },
                    }}
                  />
                </div>
              )}

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
                      },
                    },
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
                    reveal ? (
                      <EyeOff size={15} className="text-[#6B7280]" />
                    ) : (
                      <Eye size={15} className="text-[#6B7280]" />
                    )
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
                      },
                    },
                    innerInput: {
                      height: "42px",
                      fontSize: "13px",
                    },
                    visibilityToggle: {
                      "&:hover": {
                        backgroundColor: "transparent",
                      },
                    },
                  }}
                />
              </div>

              {/* Confirm Password Input (Register Only) */}
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1C243B]">
                    Konfirmasi Password
                  </label>
                  <PasswordInput
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.currentTarget.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    error={confirmPasswordError || undefined}
                    visibilityToggleIcon={({ reveal }) =>
                      reveal ? (
                        <EyeOff size={15} className="text-[#6B7280]" />
                      ) : (
                        <Eye size={15} className="text-[#6B7280]" />
                      )
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
                        },
                      },
                      innerInput: {
                        height: "42px",
                        fontSize: "13px",
                      },
                      visibilityToggle: {
                        "&:hover": {
                          backgroundColor: "transparent",
                        },
                      },
                    }}
                  />
                </div>
              )}

              {/* Remember & Forgot Row (Login Only) */}
              {!isSignUp && (
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
                        },
                      },
                    }}
                  />
                  <a
                    href="/forgot-password"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium hover:text-[#1C243B] transition-colors"
                  >
                    Forgot Password
                  </a>
                </div>
              )}

              {/* Submit Button */}
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
                      },
                    },
                  }}
                >
                  {isSignUp ? "Sign Up" : "SIGN IN"}
                </Button>
              </motion.div>

              {/* Sign In With Google */}
              <motion.div whileTap={{ scale: 0.975 }} className="w-full">
                <Button
                  variant="default"
                  onClick={handleGoogleLogin}
                  loading={isLoading}
                  leftSection={
                    <svg
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 48 48"
                      style={{ display: "block" }}
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                      />
                      <path
                        fill="#FF3D00"
                        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                      />
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
                      },
                    },
                  }}
                >
                  {isSignUp ? "Sign Up with Google" : "Sign In with Google"}
                </Button>
              </motion.div>
            </form>
          </div>

          {/* Bottom footer registration link */}
          <div className="text-center text-[13px] text-[#6B7280] font-normal">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <a
              href={isSignUp ? "/login" : "/register"}
              onClick={(e) => {
                e.preventDefault();
                toggleMode();
              }}
              className="font-bold text-[#1C243B] hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

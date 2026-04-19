"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const { resetPassword, isLoading, error } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState("");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  /* =========================
     🔐 PROTECT ROUTE (IMPORTANT)
  ========================= */
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    /* validation */
    if (!form.password || form.password.length < 8) {
      return setLocalError("Password must be at least 8 characters");
    }

    if (form.password !== form.confirmPassword) {
      return setLocalError("Passwords do not match");
    }

    if (!token) {
      return setLocalError("Invalid or missing token");
    }

    const res = await resetPassword({
      token,
      newPassword: form.password, // ✅ FIXED KEY 
      
    });

    if (res?.success) {
      setSuccess(true);
    } else {
      setLocalError(res?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0F19]">

      {/* LEFT */}
      <div className="hidden md:flex w-1/2 relative">
        <Image
          src="/images/event.jpg"
          alt="event"
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 flex flex-col justify-end p-10">
          <h2 className="text-4xl font-bold text-white">
            Secure Your Account 🔐
          </h2>
          <p className="text-gray-300 mt-3 max-w-md">
            Set a new password and continue managing your events.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col justify-center w-full md:w-1/2 px-8">
        <div className="max-w-md mx-auto w-full">

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl">

            {!success ? (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Reset Password 🔑
                </h1>

                <p className="text-gray-400 mb-6">
                  Enter your new password
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* PASSWORD */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      className="w-full pl-10 pr-10 p-3 rounded-xl bg-[#111827] text-white border border-gray-700 focus:border-purple-500"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* CONFIRM */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />

                    <input
                      type="password"
                      placeholder="Confirm Password"
                      className="w-full pl-10 p-3 rounded-xl bg-[#111827] text-white border border-gray-700 focus:border-purple-500"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* ERROR */}
                  {(localError || error) && (
                    <p className="text-red-500 text-sm">
                      {localError || error}
                    </p>
                  )}

                  {/* BUTTON */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>

                </form>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Password Updated ✅
                </h1>

                <p className="text-gray-400 mb-6">
                  You can now login with your new password
                </p>

                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                >
                  Go to Login
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
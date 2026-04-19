
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!form.email) {
      return setLocalError("Email is required");
    }

    if (!form.password) {
      return setLocalError("Password is required");
    }

    const res = await login(form);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setLocalError(res.message);
    }
  };

  return (
    <div className="min-h-screen  bg-[#0B0F19] flex flex-col md:flex-row">
      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 md:w-1/2 relative">
        <Image
          src="/images/event.jpg"
          alt="event"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 flex flex-col justify-end p-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Manage Your Events <br /> Like a Pro
          </h2>

          <p className="text-gray-300 mt-3 max-w-md">
            Create, sell tickets, track guests, and grow your events effortlessly.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex w-full md:w-1/2  justify-center items-center px-6 py-10">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome Back 👋
            </h1>

            <p className="text-gray-400 mb-6">
              Login to manage your events
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* EMAIL */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />

                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full pl-10 p-3 rounded-xl bg-[#111827] text-white outline-none border border-gray-700 focus:border-purple-500 transition"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-10 p-3 rounded-xl bg-[#111827] text-white outline-none border border-gray-700 focus:border-purple-500 transition"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />

                {/* TOGGLE */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* LINKS */}
            <div className="flex justify-between mt-5 text-sm text-gray-400">
              <Link href="/forgot-password" className="hover:text-white transition">
                Forgot password?
              </Link>

              <Link href="/register" className="hover:text-white transition">
                Sign up
              </Link>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="px-3 text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {/* GOOGLE */}
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}

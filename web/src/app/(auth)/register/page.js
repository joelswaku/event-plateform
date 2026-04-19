"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import Image from "next/image";

import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return alert("Passwords do not match");
    }

    const res = await register(form);

    if (res.success) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0F19]">

      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 relative">
        <Image
          src="/images/event.jpg"
          alt="event"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/40 flex flex-col justify-end p-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Start Your Event Journey 🚀
          </h2>

          <p className="text-gray-300 mt-3 max-w-md">
            Create events, invite guests, and grow your audience.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col justify-center w-full md:w-1/2 px-8">

        <div className="max-w-md mx-auto w-full">

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">

            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account ✨
            </h1>

            <p className="text-gray-400 mb-6">
              Get started with your event platform
            </p>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* FULL NAME */}
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-10 p-3 rounded-xl bg-[#111827] text-white border border-gray-700 focus:border-purple-500 outline-none"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>

              {/* EMAIL */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full pl-10 p-3 rounded-xl bg-[#111827] text-white border border-gray-700 focus:border-purple-500 outline-none"
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
                  className="w-full pl-10 pr-10 p-3 rounded-xl bg-[#111827] text-white border border-gray-700 focus:border-purple-500 outline-none"
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

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full pl-10 p-3 rounded-xl bg-[#111827] text-white border border-gray-700 focus:border-purple-500 outline-none"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Register"}
              </button>

            </form>

            {/* ERROR */}
            {error && (
              <p className="text-red-500 mt-4 text-sm">{error}</p>
            )}

            {/* LINKS */}
            <div className="text-center mt-5 text-sm text-gray-400">
              Already have an account?{" "}
              <Link href={"/login"}
                
                className="text-purple-400 cursor-pointer hover:text-white"
              >
                Login
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
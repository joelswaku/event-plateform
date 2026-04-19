"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // call API here
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-2xl w-full max-w-md text-center">

        {!sent ? (
          <>
            <h2 className="text-2xl font-bold mb-2">
              Forgot Password 🔑
            </h2>

            <p className="text-gray-400 mb-6">
              Enter your email to reset your password
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                className="w-full mb-4 p-3 rounded bg-white/10"
                onChange={(e) => setEmail(e.target.value)}
              />

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">
              Check your email 📧
            </h2>

            <p className="text-gray-400">
              We sent a password reset link to {email}
            </p>
          </>
        )}

      </div>
    </div>
  );
}
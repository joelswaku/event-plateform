
"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleLoginButton() {
  const router      = useRouter();
  const googleLogin = useAuthStore((s) => s.googleLogin);

  const handleSuccess = async (credentialResponse) => {
    const res = await googleLogin({ id_token: credentialResponse.credential });
    if (res.success) router.push("/dashboard");
  };

  return (
    <div className="flex justify-center [&>div]:w-full [&>div>div]:w-full [&_iframe]:w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {}}
        theme="filled_black"
        shape="rectangular"
        size="large"
        text="continue_with"
        width="400"
      />
    </div>
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow any local network device (mobile app, emulator, other machines on LAN)
  // to hit the dev server without triggering the "allowedDevOrigins" warning.
  allowedDevOrigins: ["*"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;

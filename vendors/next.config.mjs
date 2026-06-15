const nextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',

  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:5000/api/:path*" }];
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
export default nextConfig;

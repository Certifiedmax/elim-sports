import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react", "next-themes", "@supabase/supabase-js"],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default nextConfig;
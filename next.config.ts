import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Auth0 user pictures (Gravatar + Google + generic Auth0 CDN)
      { protocol: "https", hostname: "s.gravatar.com", pathname: "/**" },
      { protocol: "https", hostname: "*.gravatar.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "cdn.auth0.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

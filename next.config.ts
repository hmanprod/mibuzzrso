import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // Ajout/modification de cette ligne :
        pathname: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**` : '/**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;

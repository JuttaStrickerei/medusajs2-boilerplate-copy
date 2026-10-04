const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME
const MINIO_HOSTNAME = process.env.NEXT_PUBLIC_MINIO_ENDPOINT

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:countryCode/agb",
        destination: "/:countryCode/terms",
        permanent: true,
      },
      {
        source: "/:countryCode/impressum",
        destination: "/:countryCode/imprint",
        permanent: true,
      },
      {
        source: "/:countryCode/datenschutz",
        destination: "/:countryCode/privacy",
        permanent: true,
      },
      {
        source: "/:countryCode/widerruf",
        destination: "/:countryCode/vertrag-widerrufen",
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        // Videos haben versionierte Dateinamen (…-v2-…), daher 1 Jahr Cache
        // statt des Next-Standards max-age=0 für public/.
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // AVIF first (smaller), WebP fallback; cache optimised images for 30 days
    // instead of the 60 s default so they are not re-encoded on every visit.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      ...(MINIO_HOSTNAME
        ? [
            {
              protocol: "https",
              hostname: MINIO_HOSTNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig

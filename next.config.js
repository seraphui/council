const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use council folder as root so Next doesn't get confused by parent workspace lockfiles
  outputFileTracingRoot: path.join(__dirname),
}

module.exports = nextConfig

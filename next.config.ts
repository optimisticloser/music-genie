import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  server: {
    https: {
      key: fs.readFileSync(path.join(process.cwd(), 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(process.cwd(), 'localhost.pem')),
    },
  },
};

export default nextConfig;

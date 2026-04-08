/** @type {import('next').NextConfig} */
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  experimental: {
    reactCompiler: false,
  },
}

export default withPayload(nextConfig)


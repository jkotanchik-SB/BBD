import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Resources } from './collections/Resources'
import { Sections } from './collections/Sections'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' - MADiE CMS',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Resources, Sections, Media],
  secret: process.env.PAYLOAD_SECRET || 'madie-cms-secret-change-in-production',
  db: sqliteAdapter({
    client: {
      url: `file:${path.resolve(dirname, '../data/payload.db')}`,
    },
  }),
  editor: lexicalEditor({}),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})


# MADiE CMS Setup

This project offers two CMS options for managing Training & Resources content.

## Option 1: Lightweight JSON-based CMS (Default)

A simple Express-based CMS with JSON file storage.

### Quick Start

```bash
npm run cms
```

The CMS will be available at:
- **Admin UI**: http://localhost:3001/admin
- **API**: http://localhost:3001/api

### Features
- **Sortable columns** - Click on Title, Section, Type, or Date Added column headers to sort
- **Date Added tracking** - Automatically tracks when resources are added
- Upload PDF documents and images
- Add, edit, and delete resources
- Organize resources into sections

---

## Option 2: Payload CMS (Full-featured)

A full-featured headless CMS with Next.js admin panel, located in `/payload-cms`.

### Setup

```bash
cd payload-cms
npm install
npm run dev
```

Payload CMS will be available at:
- **Admin UI**: http://localhost:3001/admin
- **API**: http://localhost:3001/api

### Features
- Professional admin UI with authentication
- SQLite database storage
- File upload management
- Relationship fields between collections
- Full REST API

---

## Start Astro Dev Server (in another terminal)
```bash
npm run dev
```

## CMS Features

### Admin Interface
The admin interface at `/admin` allows you to:
- Upload PDF documents and images
- Add, edit, and delete resources
- Organize resources into sections
- Link uploaded files to resources

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sections` | GET | List all resource sections |
| `/api/resources` | GET | List all resources |
| `/api/resources/:id` | GET | Get a specific resource |
| `/api/resources` | POST | Create a new resource |
| `/api/resources/:id` | PUT | Update a resource |
| `/api/resources/:id` | DELETE | Delete a resource |
| `/api/upload` | POST | Upload a file |
| `/api/files` | GET | List uploaded files |
| `/api/files/:filename` | DELETE | Delete a file |

## Data Storage

- **Resources data**: `cms/data/resources.json`
- **Uploaded files**: `public/uploads/`

## Development Workflow

1. **Start CMS server**:
   ```bash
   npm run cms
   ```

2. **Start Astro dev server** (in another terminal):
   ```bash
   npm run dev
   ```

3. **Make content changes** via the admin UI at http://localhost:3001/admin

4. **Rebuild site** to see changes:
   ```bash
   npm run build
   ```

## Fallback Behavior

If the CMS server is not running during build, the site will use fallback data defined in `/src/lib/payload.ts`. This ensures the site builds successfully even without the CMS.

## Production Deployment

For production:
1. Run the CMS server on a separate process/port
2. Set the `CMS_API_URL` environment variable to point to your CMS server
3. Build the Astro site

Or for static deployment:
1. Start the CMS server locally
2. Build the site (`npm run build`)
3. Deploy the `dist/` folder

## Resource Types

- **PDF Document**: Uploaded PDFs stored in `/public/uploads/`
- **Video**: External video URLs (YouTube, Vimeo, etc.)
- **External Link**: Links to external resources

## File Upload

Supported file types:
- PDF documents (`.pdf`)
- Images (`.png`, `.jpg`, `.jpeg`, `.gif`)

Maximum file size: 25MB



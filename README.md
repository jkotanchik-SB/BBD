# Hackathon Project

Rebuilding the public MADiE site with improved UX/UI based on [emeasuretool.cms.gov](https://www.emeasuretool.cms.gov/).

Built with [Astro](https://astro.build/) and [Payload CMS](https://payloadcms.com/).

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server (Astro only)
```bash
npm run dev
```
Visit `http://localhost:4321`

### 3. Start with Payload CMS (for content management)

First, ensure MongoDB is running locally, then:

```bash
# Terminal 1: Start Payload CMS
npm run payload:dev

# Terminal 2: Start Astro
npm run dev
```

- Astro site: `http://localhost:4321`
- Payload Admin: `http://localhost:3000/admin`

## Content Management

This site uses a lightweight CMS for managing Training & Resources content. See [CMS.md](./CMS.md) for detailed setup instructions.

**Key features:**
- Upload and manage PDF documents
- Add/edit video tutorials and external links
- Organize resources into sections
- User-friendly admin interface

## Project Structure

```
├── src/
│   ├── components/     # Astro components
│   ├── layouts/        # Page layouts
│   ├── lib/            # Utility functions (Payload client)
│   ├── pages/          # Site pages
│   ├── payload/        # Payload CMS configuration
│   └── styles/         # Global CSS
├── public/
│   ├── images/         # Static images
│   └── uploads/        # Payload CMS uploaded files
└── PAYLOAD_CMS.md      # CMS setup documentation
```

## Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Start Astro dev server |
| `npm run build`   | Build for production |
| `npm run preview` | Preview production build |
| `npm run cms`     | Start Payload CMS admin |

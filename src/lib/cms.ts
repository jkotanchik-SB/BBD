/**
 * CMS API client — fetches data from the local CMS server (cms/server.ts)
 * at build time during `astro build`.
 *
 * Base URL is configured via the CMS_URL environment variable.
 * Default: http://localhost:3001
 */

const CMS_URL = import.meta.env.CMS_URL ?? "http://localhost:3001";

export interface CmsSection {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface CmsResource {
  id: string;
  title: string;
  description: string;
  section: string;
  type: "pdf" | "video" | "link";
  filename?: string;
  url?: string;
  version?: string;
  dateUpdated?: string;
  releaseDate?: string;
  year?: number;
  sortOrder: number;
}

async function cmsGet<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`);
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json() as Promise<T>;
}

export async function getSections(): Promise<CmsSection[]> {
  return cmsGet<CmsSection[]>("/api/sections");
}

export async function getResources(section?: string): Promise<CmsResource[]> {
  const query = section ? `?section=${encodeURIComponent(section)}` : "";
  return cmsGet<CmsResource[]>(`/api/resources${query}`);
}

/**
 * Returns resources grouped by year (for release notes).
 * Resources without a `year` field are grouped under "Other".
 */
export function groupByYear(
  resources: CmsResource[]
): Record<string | number, CmsResource[]> {
  return resources.reduce(
    (acc, r) => {
      const key = r.year ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {} as Record<string | number, CmsResource[]>
  );
}

/**
 * Returns the public URL for a CMS resource.
 * Uploaded files are served from the CMS server; external URLs are returned as-is.
 */
export function resourceUrl(r: CmsResource): string {
  if (r.url) return r.url;
  if (r.filename) return `/uploads/${r.filename}`;
  return "#";
}

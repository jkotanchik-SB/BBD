/**
 * Payload CMS Client for fetching resources
 * Connects to the Payload CMS server or uses fallback data
 */

export interface Resource {
  id: string;
  title: string;
  description: string;
  section: string | { id: string; slug: string; title: string };
  type: 'pdf' | 'video' | 'link';
  file?: { id: string; filename: string; url: string } | null;
  url?: string;
  version?: string;
  dateUpdated?: string;
  dateAdded?: string;
  releaseDate?: string;
  year?: number;
  sortOrder: number;
}

export interface ReleaseNote {
  id: string;
  label: string;
  href: string;
  releaseDate: string;
  version: string;
  year: number;
}

export interface ResourceSection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sortOrder: number;
}

const CMS_API_URL = import.meta.env.CMS_API_URL || 'http://localhost:3001';

/**
 * Fetch all resource sections from Payload CMS
 */
export async function getResourceSections(): Promise<ResourceSection[]> {
  try {
    const response = await fetch(`${CMS_API_URL}/api/sections?sort=sortOrder&limit=100`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sections: ${response.status}`);
    }
    const data = await response.json();
    // Payload returns { docs: [], totalDocs, ... }
    return (data.docs || data).map((s: any) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      sortOrder: s.sortOrder,
    }));
  } catch (error) {
    console.error('Error fetching resource sections:', error);
    return getFallbackSections();
  }
}

/**
 * Fetch all resources from Payload CMS
 */
export async function getResources(): Promise<Resource[]> {
  try {
    const response = await fetch(`${CMS_API_URL}/api/resources?sort=sortOrder&limit=100&depth=1`);
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.status}`);
    }
    const data = await response.json();
    // Payload returns { docs: [], totalDocs, ... }
    return data.docs || data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    return getFallbackResources();
  }
}

/**
 * Get the section slug from a resource (handles both populated and non-populated relations)
 */
export function getSectionSlug(resource: Resource): string {
  if (typeof resource.section === 'object' && resource.section?.slug) {
    return resource.section.slug;
  }
  return String(resource.section);
}

/**
 * Get the URL for a resource
 */
export function getResourceUrl(resource: Resource): string {
  // If resource has a direct URL (external links, videos, or release notes), use it
  if (resource.url) {
    return resource.url;
  }
  // For uploaded PDFs via Payload, use the file relation
  if (resource.type === 'pdf' && resource.file) {
    return resource.file.url || `/uploads/${resource.file.filename}`;
  }
  return '#';
}

/**
 * Check if a resource should open externally
 */
export function isExternalResource(resource: Resource): boolean {
  return resource.type === 'video' || resource.type === 'link';
}

/**
 * Fetch release notes from CMS and format them for display
 */
export async function getReleaseNotes(): Promise<{ [year: number]: ReleaseNote[] }> {
  try {
    const resources = await getResources();
    const releaseNoteResources = resources.filter(r => getSectionSlug(r) === 'release-notes');

    // Transform resources into ReleaseNote format and group by year
    const releaseNotes: ReleaseNote[] = releaseNoteResources.map(r => ({
      id: r.id,
      label: r.title,
      href: getResourceUrl(r),
      releaseDate: r.releaseDate || r.dateUpdated || '',
      version: r.version || '',
      year: r.year || new Date(r.releaseDate || r.dateUpdated || '').getFullYear(),
    }));

    // Sort by date descending and group by year
    releaseNotes.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    const grouped: { [year: number]: ReleaseNote[] } = {};
    for (const note of releaseNotes) {
      if (!grouped[note.year]) {
        grouped[note.year] = [];
      }
      grouped[note.year].push(note);
    }

    return grouped;
  } catch (error) {
    console.error('Error fetching release notes:', error);
    return getFallbackReleaseNotes();
  }
}

/**
 * Get sorted years from release notes (descending)
 */
export function getSortedYears(releaseNotes: { [year: number]: ReleaseNote[] }): number[] {
  return Object.keys(releaseNotes).map(Number).sort((a, b) => b - a);
}

// Fallback release notes when CMS is unavailable
function getFallbackReleaseNotes(): { [year: number]: ReleaseNote[] } {
  return {
    2026: [
      { id: 'rn-2026-1', label: 'March 17, 2026 - v3.0.0', href: 'https://www.emeasuretool.cms.gov/sites/default/files/2026-03/MADiE%203.0.0_Release%20Notes.pdf', releaseDate: '2026-03-17', version: 'v3.0.0', year: 2026 },
      { id: 'rn-2026-2', label: 'March 4, 2026 - v2.3.8', href: 'https://www.emeasuretool.cms.gov/sites/default/files/2026-03/MADiE%202.3.8_Release%20Notes.pdf', releaseDate: '2026-03-04', version: 'v2.3.8', year: 2026 },
      { id: 'rn-2026-3', label: 'February 17, 2026 - v2.3.7', href: 'https://www.emeasuretool.cms.gov/sites/default/files/2026-02/MADiE%202.3.7_Release%20Notes.pdf', releaseDate: '2026-02-17', version: 'v2.3.7', year: 2026 },
    ],
    2025: [
      { id: 'rn-2025-1', label: 'December 10, 2025 - v2.3.3', href: 'https://www.emeasuretool.cms.gov/sites/default/files/2025-12/MADiE%202.3.3_Release%20Notes_v2.pdf', releaseDate: '2025-12-10', version: 'v2.3.3', year: 2025 },
      { id: 'rn-2025-2', label: 'November 25, 2025 - v2.3.2', href: 'https://www.emeasuretool.cms.gov/sites/default/files/2025-11/MADiE%202.3.2_Release%20Notes.pdf', releaseDate: '2025-11-25', version: 'v2.3.2', year: 2025 },
    ],
  };
}

// Fallback data when CMS is unavailable
function getFallbackSections(): ResourceSection[] {
  return [
    { id: 'user-guides', slug: 'user-guides', title: 'User Guides', description: 'Comprehensive documentation to help you get started with MADiE.', sortOrder: 0 },
    { id: 'video-tutorials', slug: 'video-tutorials', title: 'Video Tutorials', description: 'Watch step-by-step video tutorials to learn how to use MADiE effectively.', sortOrder: 1 },
    { id: 'faqs', slug: 'faqs', title: 'Frequently Asked Questions', description: 'Find answers to common questions about MADiE.', sortOrder: 2 },
    { id: 'additional-resources', slug: 'additional-resources', title: 'Additional Resources', description: 'Helpful links and supplementary materials.', sortOrder: 3 },
  ];
}

function getFallbackResources(): Resource[] {
  return [
    {
      id: '1',
      title: 'MADiE User Guide',
      description: 'Complete guide covering all features of the MADiE application including measure creation, editing, and testing.',
      section: 'user-guides',
      type: 'pdf',
      file: { id: 'file-1', filename: 'MADiE_UserGuide_v3.0.pdf', url: '/uploads/MADiE_UserGuide_v3.0.pdf' },
      version: '3.0',
      dateUpdated: 'March 2024',
      sortOrder: 0,
    },
    {
      id: '2',
      title: 'MADiE Access Guide',
      description: 'Step-by-step instructions for obtaining access to the MADiE application.',
      section: 'user-guides',
      type: 'pdf',
      file: { id: 'file-2', filename: 'MADiEAccessGuide_1.0_508.pdf', url: '/uploads/MADiEAccessGuide_1.0_508.pdf' },
      version: '1.0',
      dateUpdated: 'November 2022',
      sortOrder: 1,
    },
    {
      id: '3',
      title: 'MADiE QDM Quick Reference Guide',
      description: 'Quick reference for authoring QDM-based measures in MADiE.',
      section: 'user-guides',
      type: 'pdf',
      file: { id: 'file-3', filename: 'MADiE_QDM_QuickReferenceGuide.pdf', url: '/uploads/MADiE_QDM_QuickReferenceGuide.pdf' },
      version: '1.0',
      dateUpdated: 'January 2024',
      sortOrder: 2,
    },
    {
      id: '4',
      title: 'MADiE FHIR Quick Reference Guide',
      description: 'Quick reference for authoring FHIR-based measures in MADiE.',
      section: 'user-guides',
      type: 'pdf',
      file: { id: 'file-4', filename: 'MADiE_FHIR_QuickReferenceGuide.pdf', url: '/uploads/MADiE_FHIR_QuickReferenceGuide.pdf' },
      version: '1.0',
      dateUpdated: 'January 2024',
      sortOrder: 3,
    },
    {
      id: '5',
      title: 'MADiE Overview',
      description: 'Introduction to MADiE and its key features for measure development.',
      section: 'video-tutorials',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=madie-overview',
      sortOrder: 0,
    },
    {
      id: '6',
      title: 'Creating a New Measure',
      description: 'Learn how to create and configure a new measure in MADiE.',
      section: 'video-tutorials',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=madie-new-measure',
      sortOrder: 1,
    },
    {
      id: '7',
      title: 'Working with Test Cases',
      description: 'Tutorial on creating and running test cases for your measures.',
      section: 'video-tutorials',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=madie-test-cases',
      sortOrder: 2,
    },
    {
      id: '8',
      title: 'Exporting Measures',
      description: 'How to export your measures in different formats.',
      section: 'video-tutorials',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=madie-export',
      sortOrder: 3,
    },
    {
      id: '9',
      title: 'CQL (Clinical Quality Language) Reference',
      description: 'Official documentation for the Clinical Quality Language used in eCQM development.',
      section: 'additional-resources',
      type: 'link',
      url: 'https://cql.hl7.org/',
      sortOrder: 0,
    },
    {
      id: '10',
      title: 'eCQI Resource Center',
      description: 'Central hub for electronic clinical quality improvement resources and tools.',
      section: 'additional-resources',
      type: 'link',
      url: 'https://ecqi.healthit.gov/',
      sortOrder: 1,
    },
    {
      id: '11',
      title: 'QDM User Guide',
      description: 'Documentation for the Quality Data Model used in measure specifications.',
      section: 'additional-resources',
      type: 'link',
      url: 'https://ecqi.healthit.gov/qdm',
      sortOrder: 2,
    },
    {
      id: '12',
      title: 'FHIR Quality Measure IG',
      description: 'FHIR Implementation Guide for Quality Measures.',
      section: 'additional-resources',
      type: 'link',
      url: 'https://hl7.org/fhir/us/cqfmeasures/',
      sortOrder: 3,
    },
    {
      id: '13',
      title: 'How do I request access to MADiE?',
      description: 'To request access to MADiE, visit the HCQIS Access Roles and Profile (HARP) system and submit a request for the MADiE application.',
      section: 'faqs',
      type: 'link',
      url: 'https://harp.cms.gov/',
      sortOrder: 0,
    },
    {
      id: '14',
      title: 'What measure types does MADiE support?',
      description: 'MADiE supports QDM (Quality Data Model) and FHIR (Fast Healthcare Interoperability Resources) based quality measures.',
      section: 'faqs',
      type: 'link',
      url: '#',
      sortOrder: 1,
    },
    {
      id: '15',
      title: 'How do I export a measure from MADiE?',
      description: 'You can export measures in HQMF (for QDM measures) or FHIR Measure Bundle formats from the measure details page.',
      section: 'faqs',
      type: 'link',
      url: '#',
      sortOrder: 2,
    },
    {
      id: '16',
      title: 'Who can I contact for technical support?',
      description: 'For technical support, please email the MADiE support team at madie-support@cms.hhs.gov.',
      section: 'faqs',
      type: 'link',
      url: 'mailto:madie-support@cms.hhs.gov',
      sortOrder: 3,
    },
  ];
}


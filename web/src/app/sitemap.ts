import { MetadataRoute } from 'next';

// API base URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL || 'http://localhost:5000/api';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://liteevent.com';

interface Event {
  slug: string;
  updated_at?: string;
  published_at?: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    events?: Event[];
  };
}

/**
 * Fetch all public events from the API for sitemap generation
 */
async function fetchPublicEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${API_URL}/events/public-sitemap`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      console.warn('[Sitemap] Failed to fetch public events:', response.status);
      return [];
    }

    const data: ApiResponse = await response.json();
    return data?.data?.events || [];
  } catch (error) {
    console.error('[Sitemap] Error fetching public events:', error);
    return [];
  }
}

/**
 * Generate sitemap for search engines
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;

  // Static pages with high priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/acceptable-use`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Fetch public events dynamically
  const publicEvents = await fetchPublicEvents();

  const eventRoutes: MetadataRoute.Sitemap = publicEvents.map((event) => ({
    url: `${baseUrl}/e/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Event ticketing pages (sub-routes for public events)
  const eventTicketRoutes: MetadataRoute.Sitemap = publicEvents.map((event) => ({
    url: `${baseUrl}/e/${event.slug}/tickets`,
    lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Combine all routes
  return [...staticRoutes, ...eventRoutes, ...eventTicketRoutes];
}

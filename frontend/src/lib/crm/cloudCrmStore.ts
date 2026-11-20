import { Enquiry } from '../../types';
import { DEMO_ENQUIRIES } from '../../services/mockData';

const REDIS_ENQUIRIES_KEY = 'powertech_crm_enquiries_prod_v2';

let serverEnquiriesMemoryCache: Enquiry[] | null = null;

function getCredentials() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;

  return { url, token };
}

function getInitialEnquiries(): Enquiry[] {
  return [];
}

const DEMO_IDS = ['enq-1', 'enq-2', 'enq-3', 'enq-4'];

export async function getCloudEnquiries(): Promise<Enquiry[]> {
  const { url, token } = getCredentials();

  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', REDIS_ENQUIRIES_KEY]),
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.result !== null && json.result !== undefined) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(
              (e: Enquiry) => !DEMO_IDS.includes(e.id) && e.customerName !== 'Rajesh Sharma'
            );
            serverEnquiriesMemoryCache = clean;
            return clean;
          }
        }
      }

      // Initialize with clean production array
      const initial: Enquiry[] = [];
      await saveCloudEnquiries(initial);
      return initial;
    } catch (err) {
      console.error('Error reading CRM enquiries from Cloud Redis, using memory cache:', err);
    }
  }

  if (!serverEnquiriesMemoryCache) {
    serverEnquiriesMemoryCache = getInitialEnquiries();
  }
  return serverEnquiriesMemoryCache;
}

export async function saveCloudEnquiries(enquiries: Enquiry[]): Promise<Enquiry[]> {
  serverEnquiriesMemoryCache = enquiries;
  const { url, token } = getCredentials();

  if (url && token) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', REDIS_ENQUIRIES_KEY, JSON.stringify(enquiries)]),
        cache: 'no-store',
      });
    } catch (err) {
      console.error('Failed to persist CRM enquiries to Upstash Redis:', err);
    }
  }

  return enquiries;
}

export async function saveSingleCloudEnquiry(enquiry: Enquiry): Promise<Enquiry[]> {
  const current = await getCloudEnquiries();
  const index = current.findIndex((e) => e.id === enquiry.id);

  let updatedList: Enquiry[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = {
      ...current[index],
      ...enquiry,
    };
  } else {
    updatedList = [enquiry, ...current];
  }

  return await saveCloudEnquiries(updatedList);
}

export async function updateEnquiryField(
  id: string,
  fields: Partial<Enquiry>,
  performedBy = 'System User'
): Promise<{ success: boolean; enquiry?: Enquiry; error?: string }> {
  const current = await getCloudEnquiries();
  const index = current.findIndex((e) => e.id === id);

  if (index === -1) {
    return { success: false, error: 'Enquiry not found' };
  }

  const existing = current[index];
  const changesDesc = Object.entries(fields)
    .filter(([k]) => k !== 'timeline' && k !== 'attachments')
    .map(([k, v]) => `${k} updated to ${String(v)}`)
    .join(', ');

  const newTimelineItem = {
    id: `tl-${Date.now()}`,
    action: 'FIELD_UPDATED',
    description: changesDesc || 'Record modified',
    performedBy,
    createdAt: new Date().toISOString(),
  };

  const updated: Enquiry = {
    ...existing,
    ...fields,
    timeline: [newTimelineItem, ...(existing.timeline || [])],
  };

  const updatedList = [...current];
  updatedList[index] = updated;

  await saveCloudEnquiries(updatedList);
  return { success: true, enquiry: updated };
}

export async function deleteCloudEnquiry(id: string): Promise<Enquiry[]> {
  const current = await getCloudEnquiries();
  const filtered = current.filter((e) => e.id !== id);
  return await saveCloudEnquiries(filtered);
}

import { CompanyDailyEntry } from '../../types/ledger';
import { SEED_ENTRIES } from './store';

const REDIS_KEY = 'powertech_group_billing_ledger_v2';

// Server-side in-memory fallback
let serverMemoryCache: Record<string, CompanyDailyEntry> | null = null;

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

function getInitialMap(): Record<string, CompanyDailyEntry> {
  const map: Record<string, CompanyDailyEntry> = {};
  SEED_ENTRIES.forEach((e) => {
    map[e.id] = e;
  });
  return map;
}

export async function getCloudLedgerEntries(): Promise<Record<string, CompanyDailyEntry>> {
  const { url, token } = getCredentials();

  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', REDIS_KEY]),
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.result !== null && json.result !== undefined) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          return parsed;
        }
      }

      // If empty in cloud database, initialize with clean audited SEED_ENTRIES
      const initialMap = getInitialMap();
      await saveCloudLedgerEntries(initialMap);
      return initialMap;
    } catch (err) {
      console.error('Error reading from Cloud Redis, using memory cache:', err);
    }
  }

  if (!serverMemoryCache) {
    serverMemoryCache = getInitialMap();
  }
  return serverMemoryCache;
}

export async function saveCloudLedgerEntries(
  entries: Record<string, CompanyDailyEntry>
): Promise<boolean> {
  serverMemoryCache = entries;
  const { url, token } = getCredentials();

  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', REDIS_KEY, JSON.stringify(entries)]),
        cache: 'no-store',
      });
      return res.ok;
    } catch (err) {
      console.error('Error saving to Cloud Redis:', err);
      return false;
    }
  }

  return true;
}

export async function saveSingleCloudEntry(
  entry: CompanyDailyEntry
): Promise<Record<string, CompanyDailyEntry>> {
  const all = await getCloudLedgerEntries();
  const key = `${entry.companyId}_${entry.date}`;
  all[key] = {
    ...entry,
    id: key,
  };
  await saveCloudLedgerEntries(all);
  return all;
}

export async function deleteSingleCloudEntry(
  companyId: string,
  date: string
): Promise<Record<string, CompanyDailyEntry>> {
  const all = await getCloudLedgerEntries();
  const key = `${companyId}_${date}`;
  delete all[key];
  await saveCloudLedgerEntries(all);
  return all;
}

export interface LedgerSettings {
  unlockedDates: string[]; // Specific historical dates unlocked by Super Admin for data entry/revisions
  updatedAt?: string;
  updatedBy?: string;
}

const REDIS_SETTINGS_KEY = 'powertech_ledger_settings_v2';
let serverSettingsCache: LedgerSettings = {
  unlockedDates: ['2026-11-18'],
  updatedAt: new Date().toISOString(),
  updatedBy: 'Super Admin',
};

export async function getCloudLedgerSettings(): Promise<LedgerSettings> {
  const { url, token } = getCredentials();
  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', REDIS_SETTINGS_KEY]),
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.result !== null && json.result !== undefined) {
          const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
          if (parsed) {
            const dates = Array.isArray(parsed.unlockedDates)
              ? parsed.unlockedDates
              : parsed.allowNov18Update
              ? ['2026-11-18']
              : [];
            return {
              ...parsed,
              unlockedDates: dates,
            };
          }
        }
      }
    } catch (err) {
      console.error('Error fetching settings from Redis:', err);
    }
  }
  return serverSettingsCache;
}

export async function saveCloudLedgerSettings(settings: LedgerSettings): Promise<LedgerSettings> {
  serverSettingsCache = settings;
  const { url, token } = getCredentials();
  if (url && token) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', REDIS_SETTINGS_KEY, JSON.stringify(settings)]),
        cache: 'no-store',
      });
    } catch (err) {
      console.error('Error saving settings to Redis:', err);
    }
  }
  return settings;
}

export async function toggleCloudDateUnlock(
  targetDate: string,
  unlock: boolean,
  updatedBy = 'Super Admin'
): Promise<LedgerSettings> {
  const current = await getCloudLedgerSettings();
  let dates = [...(current.unlockedDates || [])];
  if (unlock) {
    if (!dates.includes(targetDate)) {
      dates.push(targetDate);
    }
  } else {
    dates = dates.filter((d) => d !== targetDate);
  }

  const updated: LedgerSettings = {
    unlockedDates: dates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  return await saveCloudLedgerSettings(updated);
}

export interface ParsedTravelDocument {
  arrivalDate: string | null;
  departureDate: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  documentType: 'itinerary' | 'flight' | 'hotel' | 'unknown';
}

const ISO_DATE = /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/g;
const EU_DATE = /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/g;
const LONG_DATE =
  /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/gi;

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${iso}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : iso;
}

function collectDates(text: string): string[] {
  const found = new Set<string>();

  for (const match of text.matchAll(ISO_DATE)) {
    const iso = toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
    if (iso) found.add(iso);
  }

  for (const match of text.matchAll(EU_DATE)) {
    const iso = toIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    if (iso) found.add(iso);
  }

  for (const match of text.matchAll(LONG_DATE)) {
    const monthKey = match[2].toLowerCase();
    const month = MONTH_INDEX[monthKey];
    if (month !== undefined) {
      const iso = toIsoDate(Number(match[3]), month + 1, Number(match[1]));
      if (iso) found.add(iso);
    }
  }

  return [...found].sort();
}

function detectDocumentType(text: string): ParsedTravelDocument['documentType'] {
  const lower = text.toLowerCase();
  if (/\b(flight|airline|boarding|pnr|itinerary|e-ticket)\b/.test(lower)) return 'flight';
  if (/\b(hotel|reservation|check-in|accommodation|booking\.com|airbnb)\b/.test(lower)) {
    return 'hotel';
  }
  if (/\b(itinerary|travel plan|trip details)\b/.test(lower)) return 'itinerary';
  return 'unknown';
}

function extractHotelName(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/\b(hotel|inn|resort|suites|lodge|hostel)\b/i.test(line) && line.length < 120) {
      return line.replace(/^(hotel|property|accommodation)\s*:\s*/i, '').trim();
    }
  }

  const inline = text.match(
    /(?:hotel|property|accommodation)\s*[:\-]\s*([^\n\r]{3,80})/i
  );
  return inline?.[1]?.trim() ?? null;
}

function extractHotelAddress(text: string): string | null {
  const match = text.match(
    /(?:address|location)\s*[:\-]\s*([^\n\r]{8,120})/i
  );
  return match?.[1]?.trim() ?? null;
}

export function parseTravelDocumentText(ocrText: string): ParsedTravelDocument {
  const dates = collectDates(ocrText);
  const documentType = detectDocumentType(ocrText);

  return {
    arrivalDate: dates[0] ?? null,
    departureDate: dates.length > 1 ? dates[dates.length - 1] : dates[0] ?? null,
    hotelName: extractHotelName(ocrText),
    hotelAddress: extractHotelAddress(ocrText),
    documentType,
  };
}

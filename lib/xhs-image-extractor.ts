const MAX_IMAGES = 300;
const IMAGE_URL_REGEX = /https?:\/\/[^"'\s>]+/i;
const ALLOWED_HOST = /(xhscdn\.com|xiaohongshu\.com)/i;
const NOISE_HINT = /(avatar|icon|emoji|logo|qrcode|profile|badge|favicon)/i;

export type ExtractedImage = {
  url: string;
  source: string;
  domIndex?: number;
};

export type ExtractResult = {
  title: string;
  cover: string;
  images: string[];
  content: string;
  noteId?: string | null;
};

export function isAllowedUrl(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  if (!IMAGE_URL_REGEX.test(value)) {
    return false;
  }
  try {
    const parsed = new URL(value);
    if (!ALLOWED_HOST.test(parsed.hostname)) {
      return false;
    }
    if (parsed.pathname.includes('/avatar/')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getSizeHintFromUrl(value: string): number | null {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname;
    const match = path.match(/\/(?:w|h)\/(\d+)\//i);
    if (match) {
      return Number(match[1]);
    }
    const view = path.match(/imageView2\/\d+\/w\/(\d+)/i);
    if (view) {
      return Number(view[1]);
    }
  } catch {
    return null;
  }
  return null;
}

function isLikelyContentUrl(value: string): boolean {
  if (NOISE_HINT.test(value)) {
    return false;
  }
  const sizeHint = getSizeHintFromUrl(value);
  if (sizeHint && sizeHint >= 300) {
    return true;
  }
  return /(note|notes|photo|image)/i.test(value);
}

export function extractImageFromObject(obj: Record<string, any>, output: ExtractedImage[], source: string): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const urlKeys = ['url', 'originUrl', 'originalUrl', 'urlDefault', 'defaultUrl', 'fileUrl', 'imageUrl'];
  let url: string | null = null;
  for (const key of urlKeys) {
    if (typeof obj[key] === 'string' && isAllowedUrl(obj[key])) {
      url = obj[key];
      break;
    }
  }
  if (!url) {
    return false;
  }
  const width = Number(obj.width || obj.imageWidth || obj.w || 0);
  const height = Number(obj.height || obj.imageHeight || obj.h || 0);
  if ((width && width < 300) || (height && height < 300)) {
    return false;
  }
  if (!isLikelyContentUrl(url)) {
    return false;
  }
  output.push({ url, source });
  return true;
}

export function collectUrlsFromObject(
  value: any,
  output: ExtractedImage[],
  source: string,
  options: { allowLoose?: boolean } = {}
) {
  if (!value || output.length >= MAX_IMAGES) {
    return;
  }
  if (typeof value === 'string') {
    if (options.allowLoose && isAllowedUrl(value) && isLikelyContentUrl(value)) {
      output.push({ url: value, source });
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectUrlsFromObject(item, output, source, options);
      if (output.length >= MAX_IMAGES) {
        break;
      }
    }
    return;
  }
  if (typeof value === 'object') {
    if (extractImageFromObject(value, output, source)) {
      return;
    }
    for (const key of Object.keys(value)) {
      collectUrlsFromObject(value[key], output, source, options);
      if (output.length >= MAX_IMAGES) {
        break;
      }
    }
  }
}

export function normalizeImageKey(url: string): string {
  if (!url) {
    return '';
  }
  const noQuery = url.split('?')[0];
  const bangIndex = noQuery.indexOf('!');
  if (bangIndex > -1) {
    return noQuery.slice(0, bangIndex);
  }
  return noQuery;
}

export function uniqueImagesByKey(list: ExtractedImage[], keyFn: (value: string) => string): ExtractedImage[] {
  const seen = new Set();
  const results: ExtractedImage[] = [];
  for (const item of list) {
    if (!item || !item.url) {
      continue;
    }
    const key = keyFn(item.url);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(item);
    if (results.length >= MAX_IMAGES) {
      break;
    }
  }
  return results;
}

function uniqueUrlsByKey(list: string[], keyFn: (value: string) => string): string[] {
  const seen = new Set();
  const results: string[] = [];
  for (const url of list) {
    const key = keyFn(url);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    results.push(url);
    if (results.length >= MAX_IMAGES) {
      break;
    }
  }
  return results;
}

function parseNextDataFromHtml(html: string): ExtractedImage[] {
  const scriptMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) {
    return [];
  }
  try {
    const data = JSON.parse(scriptMatch[1]);
    const results: ExtractedImage[] = [];
    collectUrlsFromObject(data, results, 'next-data', { allowLoose: true });
    return results;
  } catch {
    return [];
  }
}

function parseInlineStateFromHtml(html: string): ExtractedImage[] {
  const stateMatch = html.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\})\s*;?/);
  if (!stateMatch) {
    return [];
  }
  try {
    const data = JSON.parse(stateMatch[1]);
    const results: ExtractedImage[] = [];
    collectUrlsFromObject(data, results, 'inline-state', { allowLoose: true });
    return results;
  } catch {
    return [];
  }
}

function getAttributeValue(tag: string, name: string): string | null {
  const regex = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i');
  const match = tag.match(regex);
  return match ? match[1] : null;
}

function parseSrcSet(value: string): string | null {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) {
    return null;
  }
  const last = parts[parts.length - 1];
  return last.split(' ')[0] || null;
}

function extractImageUrlsFromHtmlText(html: string): string[] {
  const matches = html.match(/https?:\/\/[^"'\\s>]+/g) || [];
  return matches
    .filter((url) => ALLOWED_HOST.test(url))
    .filter((url) => !NOISE_HINT.test(url))
    .slice(0, MAX_IMAGES);
}

function parseImgTagsFromHtml(html: string): ExtractedImage[] {
  const results: ExtractedImage[] = [];
  const regex = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  let domIndex = 0;

  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];
    const src =
      getAttributeValue(tag, 'src') ||
      getAttributeValue(tag, 'data-src') ||
      getAttributeValue(tag, 'data-original') ||
      getAttributeValue(tag, 'data-origin') ||
      getAttributeValue(tag, 'data-lazy-src') ||
      null;
    const srcset = getAttributeValue(tag, 'srcset');
    const resolvedSrc = src || (srcset ? parseSrcSet(srcset) : null);

    if (!resolvedSrc || !isAllowedUrl(resolvedSrc)) {
      domIndex += 1;
      continue;
    }

    const widthValue = Number(getAttributeValue(tag, 'width') || 0);
    const heightValue = Number(getAttributeValue(tag, 'height') || 0);
    if ((widthValue && widthValue < 300) || (heightValue && heightValue < 300)) {
      domIndex += 1;
      continue;
    }

    const className = (getAttributeValue(tag, 'class') || '').toString();
    const alt = (getAttributeValue(tag, 'alt') || '').toString();
    if (NOISE_HINT.test(className) || NOISE_HINT.test(alt)) {
      domIndex += 1;
      continue;
    }

    results.push({ url: resolvedSrc, source: 'img', domIndex });
    domIndex += 1;
  }

  return results;
}

function extractMetaContent(html: string, key: string): string {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match = html.match(regex);
  return match ? match[1] : '';
}

function extractTitleFromHtml(html: string): string {
  const ogTitle = extractMetaContent(html, 'og:title');
  if (ogTitle) return decodeHtmlEntities(ogTitle);

  const twitterTitle = extractMetaContent(html, 'twitter:title');
  if (twitterTitle) return decodeHtmlEntities(twitterTitle);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';
}

function extractDescriptionFromHtml(html: string): string {
  const ogDescription = extractMetaContent(html, 'og:description');
  if (ogDescription) return decodeHtmlEntities(ogDescription);

  const description = extractMetaContent(html, 'description');
  if (description) return decodeHtmlEntities(description);

  const twitterDescription = extractMetaContent(html, 'twitter:description');
  if (twitterDescription) return decodeHtmlEntities(twitterDescription);

  return '';
}

function extractCoverFromHtml(html: string, fallbackImages: string[]): string {
  const ogImage = extractMetaContent(html, 'og:image');
  if (ogImage) return ogImage;

  const twitterImage = extractMetaContent(html, 'twitter:image');
  if (twitterImage) return twitterImage;

  return fallbackImages[0] || '';
}

function decodeHtmlEntities(value: string): string {
  if (!value) return '';
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function tryUnescapeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  } catch {
    return value;
  }
}

const TEXT_KEYS = new Set([
  'desc',
  'description',
  'content',
  'note',
  'noteText',
  'note_text',
  'text',
  'summary'
]);

function collectTextFromObject(
  data: unknown,
  results: string[],
  depth = 0,
  maxDepth = 6
): void {
  if (depth > maxDepth || data === null || data === undefined) {
    return;
  }
  if (typeof data === 'string') {
    return;
  }
  if (Array.isArray(data)) {
    data.forEach((item) => collectTextFromObject(item, results, depth + 1, maxDepth));
    return;
  }
  if (typeof data === 'object') {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (TEXT_KEYS.has(key) && typeof value === 'string') {
        results.push(value);
      }
      collectTextFromObject(value, results, depth + 1, maxDepth);
    });
  }
}

function pickBestContent(candidates: string[]): string {
  const normalize = (text: string) => text.replace(/\s+/g, '');
  const boilerplate = new Set([
    normalize('3亿人的生活经验都在小红书'),
    normalize('3 亿人的生活经验都在小红书'),
    normalize('3 亿人的生活经验，都在小红书'),
    normalize('小红书'),
    normalize('发现精彩生活')
  ]);

  const cleaned = candidates
    .map((item) => decodeHtmlEntities(String(item)).trim())
    .filter((item) => item.length > 0 && !/^https?:\/\//i.test(item))
    .filter((item) => !boilerplate.has(normalize(item)));

  if (cleaned.length === 0) return '';

  return cleaned.sort((a, b) => b.length - a.length)[0];
}

function extractContentFromHtml(html: string): string {
  const candidates: string[] = [];
  const regexes = [
    /"desc"\s*:\s*"([^"]+)"/g,
    /"description"\s*:\s*"([^"]+)"/g,
    /"content"\s*:\s*"([^"]+)"/g,
    /"noteText"\s*:\s*"([^"]+)"/g,
    /"note_text"\s*:\s*"([^"]+)"/g
  ];

  regexes.forEach((regex) => {
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(html))) {
      const raw = match[1];
      if (!raw) continue;
      candidates.push(tryUnescapeJsonString(raw));
    }
  });

  return pickBestContent(candidates);
}

function extractContentFromJson(html: string): string {
  const candidates: string[] = [];

  const nextMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1]);
      collectTextFromObject(data, candidates);
    } catch {}
  }

  const stateMatch = html.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\})\s*;?/);
  if (stateMatch) {
    try {
      const data = JSON.parse(stateMatch[1]);
      collectTextFromObject(data, candidates);
    } catch {}
  }

  return pickBestContent(candidates);
}

export function normalizeImageUrl(input: string): string {
  if (!input) {
    return '';
  }
  let url = input;
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  if (url.includes('xhscdn.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function getNoteIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(?:explore|discovery\/item)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function collectAllImagesFromHtml(html: string): ExtractedImage[] {
  const domRaw = parseImgTagsFromHtml(html);
  const domImages = uniqueImagesByKey(domRaw, normalizeImageKey);
  domImages.sort((a, b) => (a.domIndex || 0) - (b.domIndex || 0));

  const dataImages = uniqueImagesByKey(
    [...parseNextDataFromHtml(html), ...parseInlineStateFromHtml(html)],
    normalizeImageKey
  );

  const dataMap = new Map<string, ExtractedImage>();
  dataImages.forEach((item) => {
    dataMap.set(normalizeImageKey(item.url), item);
  });

  const ordered: ExtractedImage[] = [];
  domImages.forEach((item) => {
    ordered.push(item);
    dataMap.delete(normalizeImageKey(item.url));
  });
  dataMap.forEach((item) => ordered.push(item));

  return uniqueImagesByKey(ordered, normalizeImageKey);
}

export function extractXhsFromHtml(html: string, url: string): ExtractResult {
  const domImages = collectAllImagesFromHtml(html).map((item) => item.url);
  const regexImages = extractImageUrlsFromHtmlText(html);
  const images = uniqueUrlsByKey([...domImages, ...regexImages], normalizeImageKey);
  const title = extractTitleFromHtml(html);
  const cover = extractCoverFromHtml(html, images);
  const contentFromJson = extractContentFromJson(html);
  const contentFromHtml = extractContentFromHtml(html);
  const contentFromMeta = extractDescriptionFromHtml(html);
  const content = contentFromJson || contentFromHtml || contentFromMeta;
  return {
    title,
    cover,
    images,
    content,
    noteId: getNoteIdFromUrl(url)
  };
}


class DomainNormalizer {
  /**
   * Deep Interface: Takes any string (URL or raw domain) and returns a normalized domain.
   * Standardizes: lowercase, no protocol, no 'www.', no path.
   */
  normalize(input: string | undefined | null): string | null {
    if (!input) return null;

    let domain = input.trim().toLowerCase();

    // Handle full URLs
    if (domain.includes('://') || domain.startsWith('//')) {
      try {
        const url = new URL(domain.startsWith('//') ? `https:${domain}` : domain);
        domain = url.hostname;
      } catch {
        // Fallback to manual stripping if URL is partially malformed
        domain = domain.replace(/^https?:\/\//, '');
      }
    }

    // Strip path and query if present (for cases like "youtube.com/watch")
    domain = domain.split('/')[0].split('?')[0];

    // Remove 'www.' prefix
    domain = domain.replace(/^www\./, '');

    // Basic validation: must contain at least one dot and not end with a dot
    if (!domain.includes('.') || domain.endsWith('.')) {
      // Allow 'localhost' or similar if needed, but for a site blocker we usually want TLDs
      if (domain !== 'localhost') {
        return null;
      }
    }

    return domain;
  }
}

export const domainNormalizer = new DomainNormalizer();

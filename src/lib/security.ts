// Input sanitization utilities

/**
 * Sanitize string input - strip HTML tags and trim
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
};

/**
 * Sanitize for display only (decode back for storage, encode for display)
 */
export const sanitizeForDisplay = (input: string): string => {
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate phone number (Bangladesh format)
 */
export const isValidPhone = (phone: string): boolean => {
  return /^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Check if honeypot fields are filled (bot detection)
 */
export const isBot = (honeypotValue: string): boolean => {
  return honeypotValue.trim().length > 0;
};

/**
 * Add security meta headers via meta tags
 */
export const addSecurityHeaders = () => {
  const metas = [
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-Frame-Options', content: 'DENY' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
    { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
    { httpEquiv: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' },
  ];

  metas.forEach(({ httpEquiv, content }) => {
    if (!document.querySelector(`meta[http-equiv="${httpEquiv}"]`)) {
      const meta = document.createElement('meta');
      meta.httpEquiv = httpEquiv;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });
};

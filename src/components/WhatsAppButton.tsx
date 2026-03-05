import { useSettings } from '@/hooks/useSupabaseData';

const normalizeBangladeshPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  return digits;
};

const isMobileDevice = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

const WhatsAppButton = () => {
  const { data: settings } = useSettings();
  const rawNumber = (settings as any)?.whatsapp_number || '';
  const phoneNumber = normalizeBangladeshPhone(rawNumber);

  if (!phoneNumber || phoneNumber.length < 11 || phoneNumber.includes('X')) {
    return null;
  }

  const message = encodeURIComponent('আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।');
  const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
  const webUrl = `https://wa.me/${phoneNumber}?text=${message}`;
  const desktopUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (isMobileDevice()) {
      window.location.href = appUrl;
      window.setTimeout(() => {
        window.location.href = webUrl;
      }, 700);
      return;
    }

    window.open(desktopUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <a
      href={webUrl}
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-success text-success-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
      aria-label="WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.335 22.594c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.794-8.064-7.11-.23-.316-1.932-2.574-1.932-4.908s1.222-3.482 1.656-3.96c.434-.478.948-.598 1.264-.598.316 0 .632.002.908.016.292.014.684-.11 1.07.816.39.948 1.326 3.24 1.444 3.474.118.234.196.508.04.816-.158.316-.236.512-.472.79-.234.276-.494.616-.706.826-.234.234-.478.49-.206.96.274.47 1.216 2.006 2.61 3.25 1.792 1.6 3.302 2.096 3.772 2.33.47.234.746.196 1.02-.118.274-.316 1.178-1.374 1.492-1.846.316-.47.632-.39 1.066-.234.434.158 2.762 1.302 3.234 1.54.47.234.786.352.904.548.118.196.118 1.138-.272 2.236z"/>
      </svg>
    </a>
  );
};

export default WhatsAppButton;

import { MessageCircle } from 'lucide-react';
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
      <MessageCircle className="w-7 h-7" />
    </a>
  );
};

export default WhatsAppButton;

import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/hooks/useSupabaseData';

const WhatsAppButton = () => {
  const { data: settings } = useSettings();
  const rawNumber = (settings as any)?.whatsapp_number || '';
  
  // Clean phone number: remove spaces, dashes, plus signs, keep only digits
  const phoneNumber = rawNumber.replace(/[^0-9]/g, '');
  
  // Don't render if no valid number
  if (!phoneNumber || phoneNumber === '8801XXXXXXXXX' || phoneNumber.includes('X')) {
    return null;
  }

  const message = encodeURIComponent('আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।');

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
      aria-label="WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </a>
  );
};

export default WhatsAppButton;

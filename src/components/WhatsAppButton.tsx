import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '8801XXXXXXXXX'; // placeholder
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

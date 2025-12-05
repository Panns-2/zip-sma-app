

import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle } from "lucide-react";

interface ContactBarProps {
  schoolPhone?: string;
  schoolEmail?: string;
}

export default function ContactBar({ schoolPhone, schoolEmail }: ContactBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t md:hidden z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          <Button asChild variant="ghost" className="flex flex-col h-auto items-center gap-1 text-primary p-2">
            <a href={schoolPhone ? `tel:${schoolPhone}` : '#'}>
              <Phone className="w-5 h-5" />
              <span className="text-xs">Call</span>
            </a>
          </Button>
          <Button asChild variant="ghost" className="flex flex-col h-auto items-center gap-1 text-primary p-2">
            <a href={schoolEmail ? `mailto:${schoolEmail}` : '#'}>
              <Mail className="w-5 h-5" />
              <span className="text-xs">Email</span>
            </a>
          </Button>
          <Button asChild variant="ghost" className="flex flex-col h-auto items-center gap-1 text-primary p-2">
            <a href={schoolPhone ? `https://wa.me/${schoolPhone.replace(/\D/g, '')}` : '#'} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
}

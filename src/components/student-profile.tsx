
import { UserCircle2, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';


interface StudentProfileProps {
  name: string;
  studentClass: string;
  studentId: string;
  profilePicture?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function StudentProfile({ name, studentClass, studentId, profilePicture, onRefresh, isRefreshing }: StudentProfileProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name ? name.substring(0, 2) : '';
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={profilePicture} alt={name} data-ai-hint="person portrait"/>
            <AvatarFallback>
              <UserCircle2 className="w-12 h-12 text-primary" />
            </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold font-headline">{name}</h2>
          <p className="text-muted-foreground">{studentClass} • Student ID: {studentId}</p>
        </div>
      </div>
       <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}

    
    
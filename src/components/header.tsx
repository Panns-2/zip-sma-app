
'use client';

import { useRouter } from 'next/navigation';
import { ZipSMALogo } from '@/components/zipsma-logo';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, School } from 'lucide-react';
import { signOutUser } from '@/lib/data-store';
import { useFirebase } from '@/firebase/client-provider';

interface HeaderProps {
  userName?: string;
  userIdentifier?: string;
  profilePicture?: string;
  schoolName?: string;
  schoolLogoUrl?: string;
}

export default function Header({ userName = "Parent", userIdentifier = "", profilePicture, schoolName, schoolLogoUrl }: HeaderProps) {
  const router = useRouter();
  const { auth } = useFirebase();

  const handleLogout = async () => {
    if (auth) {
      await signOutUser(auth);
    }
    router.push('/');
  };

  const getInitials = (name: string) => {
    if (!name) return "P";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name ? name.substring(0, 2) : 'PA';
  }

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
           {schoolLogoUrl ? (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={schoolLogoUrl} alt={schoolName} />
                    <AvatarFallback><School /></AvatarFallback>
                </Avatar>
           ) : (
                <ZipSMALogo />
           )}
          <h1 className="text-xl font-bold text-primary font-headline">{schoolName || 'ZipSMA'}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarImage src={profilePicture} alt={userName} data-ai-hint="person portrait"/>
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                {userIdentifier && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {userIdentifier}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

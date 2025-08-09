
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Users,
  Menu,
  PanelLeft,
  KeySquare,
  User as UserIcon
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  useSidebar,
  SidebarTrigger
} from '@/components/ui/sidebar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLogo } from '@/components/icons';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';


const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/admin/users', icon: Users, label: 'Pengguna' },
  { href: '/admin/codes', icon: KeySquare, label: 'Kode Aktivasi' },
];

function AdminLayoutContent({ 
  children,
  user
}: { 
  children: React.ReactNode;
  user: User | null;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const BottomNavbar = () => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 flex justify-around items-center">
            {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 rounded-md", pathname === item.href ? "text-primary" : "text-muted-foreground")}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                </Link>
            ))}
        </div>
    )
  }

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AppLogo className="size-8 text-primary" />
                <span className="text-lg font-semibold font-headline group-data-[state=collapsed]:hidden">Admin Lakukelas</span>
            </div>
            <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin'}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "https://placehold.co/40x40.png"} alt="Admin" data-ai-hint="admin portrait" />
                    <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="text-left group-data-[state=collapsed]:hidden">
                    <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="right" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || 'Admin User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                        <UserIcon className="mr-2 h-4 w-4" />Ke Dasbor Guru
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="p-4 sm:p-6 lg:p-8 flex items-center md:hidden">
            <SidebarTrigger />
            <div className="flex items-center gap-2 ml-4">
              <AppLogo className="size-8 text-primary" />
              <span className="text-lg font-semibold font-headline">Admin Lakukelas</span>
            </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 pt-0 md:pt-8">
            {children}
        </div>
      </SidebarInset>
      {isMobile && <BottomNavbar />}
    </>
  )
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  
  React.useEffect(() => {
    const supabase = createClient();
    const checkUser = async () => {
      if (!supabase) {
        setLoading(false);
        router.push('/');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Memuat dasbor admin...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminLayoutContent user={user}>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}

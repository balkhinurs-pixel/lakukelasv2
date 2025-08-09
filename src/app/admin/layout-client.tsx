
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Users,
  Menu,
  KeySquare,
  User as UserIcon,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';


const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/admin/users', icon: Users, label: 'Pengguna' },
  { href: '/admin/codes', icon: KeySquare, label: 'Kode Aktivasi' },
];

export default function AdminLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const SidebarNavContent = () => (
    <>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin'}
              tooltip={{ children: item.label }}
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link href={item.href}>
                <item.icon className="group-data-[active=true]:text-primary" />
                <span className="group-data-[collapsible=icon]:hidden group-data-[active=true]:text-primary group-data-[active=true]:font-semibold">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );

  const BottomNavbar = () => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 flex justify-around items-center">
            {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 rounded-md", pathname === item.href ? "text-primary" : "text-muted-foreground")}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                </Link>
            ))}
             <button onClick={toggleSidebar} className="flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground">
                <Menu className="w-5 h-5" />
                <span className="text-xs">Lainnya</span>
            </button>
        </div>
    )
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-0 text-background">
           <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden">
              <Avatar className="h-20 w-20 border-4 border-white/50">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="Admin" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-lg font-bold">{profile?.full_name || 'Admin User'}</p>
                <p className="text-sm text-primary-foreground/80">{user?.email}</p>
              </div>
          </div>
          <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex group-data-[state=expanded]:hidden">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="Admin" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
           <SidebarNavContent />
        </SidebarContent>

        <SidebarFooter className="p-2">
            <SidebarSeparator className="my-2" />
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip={{ children: "Ke Dasbor Guru" }}
                        className="group-data-[collapsible=icon]:justify-center"
                    >
                        <Link href="/dashboard">
                            <UserIcon />
                            <span className="group-data-[collapsible=icon]:hidden">Ke Dasbor Guru</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleLogout}
                        tooltip={{ children: "Keluar" }}
                        className="group-data-[collapsible=icon]:justify-center"
                    >
                        <LogOut />
                        <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="p-4 sm:p-6 lg:p-8 flex items-center md:hidden">
            <SidebarTrigger />
        </header>
        <div className="p-4 sm:p-6 lg:p-8 pt-0 md:pt-8">
            {children}
        </div>
      </SidebarInset>
      {isMobile && <BottomNavbar />}
    </>
  )
}

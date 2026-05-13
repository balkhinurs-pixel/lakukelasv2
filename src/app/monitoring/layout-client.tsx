'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  UserCheck as UserCheckIcon,
  Activity,
  Home,
  ChevronLeft,
  Bell,
  Settings,
  ShieldCheck,
  Search,
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
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const monitoringNavItems = [
  { href: '/monitoring', icon: LayoutDashboard, label: 'Dasbor Statistik' },
  { href: '/monitoring/teacher-attendance', icon: UserCheckIcon, label: 'Kehadiran Guru' },
  { href: '/monitoring/teacher-activity', icon: Activity, label: 'Aktivitas Guru' },
];

export default function MonitoringLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'role'> | null;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toggleSidebar, openMobile } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const AppHeader = () => (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden text-white hover:bg-white/20 hover:text-white" />
                 <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-white">Panel</span>
                    <span className="text-teal-200 ml-1">Monitoring</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden sm:flex text-white hover:bg-white/20">
                    <Link href="/dashboard">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Mode Guru
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                    <Bell className="h-5 w-5" />
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Kepsek'} data-ai-hint="admin portrait"/>
                                <AvatarFallback className="text-foreground text-xs">{profile?.full_name?.charAt(0) || 'K'}</AvatarFallback>
                             </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard">
                                <Home className="mr-2 h-4 w-4"/>
                                Kembali ke Dasbor Guru
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4"/>
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </header>
  );

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-0 text-background">
          <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
              
              <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="User" data-ai-hint="headmaster portrait" />
                <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-center relative z-10">
                <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'User'}</p>
                <div className="mt-2">
                  <div className="text-xs font-semibold px-3 py-1 rounded-lg border backdrop-blur-sm bg-teal-500/20 text-teal-100 border-teal-300/30">
                    🎓 Kepala Sekolah
                  </div>
                </div>
              </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 bg-gradient-to-b from-background to-background/95">
          <ScrollArea className="h-full">
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-teal-600 font-semibold text-sm tracking-wider uppercase bg-teal-500/5 px-3 py-2 rounded-lg border border-teal-500/10 mb-4">
                Menu Monitoring
              </SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {monitoringNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "rounded-xl mx-2 transition-all duration-300",
                          isActive && "bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm"
                        )}
                      >
                        <Link href={item.href} onClick={() => {if (isMobile) toggleSidebar()}}>
                          <item.icon className={cn("w-4 h-4 mr-2", isActive && "text-teal-600")} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Kembali ke Guru" }}>
                        <Link href="/dashboard" className="flex items-center gap-3 w-full text-teal-600 font-bold">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="group-data-[collapsible=icon]:hidden">Mode Dasbor Guru</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                {profile?.role === 'admin' && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-blue-600 font-bold">
                            <Link href="/admin">
                                <Settings className="w-4 h-4 mr-2" />
                                <span className="group-data-[collapsible=icon]:hidden">Panel Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                <SidebarSeparator className="my-2" />
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleLogout}
                        className="hover:bg-red-50 hover:text-red-600 rounded-xl"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Keluar</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className={isMobile ? "pb-20" : ""}>
        <AppHeader />
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>

      {isMobile && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t p-2 flex justify-around items-center">
              <Link href="/monitoring" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/monitoring" ? "text-teal-600 bg-teal-500/10" : "text-muted-foreground")}>
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Dasbor</span>
              </Link>
              <Link href="/monitoring/teacher-attendance" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/monitoring/teacher-attendance" ? "text-teal-600 bg-teal-500/10" : "text-muted-foreground")}>
                  <UserCheckIcon className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Absensi</span>
              </Link>
              
              <button 
                onClick={() => toggleSidebar()} 
                className="group flex flex-col items-center justify-center -mt-8 h-14 w-14 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg border-4 border-background transition-all active:scale-95"
                aria-expanded={openMobile}
                aria-label={openMobile ? "Tutup menu" : "Buka menu"}
              >
                  <svg
                    className="pointer-events-none"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12L20 12"
                      className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                    />
                  </svg>
              </button>

              <Link href="/monitoring/teacher-activity" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/monitoring/teacher-activity" ? "text-teal-600 bg-teal-500/10" : "text-muted-foreground")}>
                  <Activity className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Aktivitas</span>
              </Link>
              <Link href="/dashboard" className={cn("flex flex-col items-center p-2 rounded-xl transition-all text-muted-foreground")}>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Guru</span>
              </Link>
          </div>
      )}
    </>
  );
}

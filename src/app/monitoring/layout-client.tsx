'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  UserCheck as UserCheckIcon,
  Activity,
  Home,
  ChevronLeft,
  Bell,
  Settings,
  ShieldCheck,
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
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const MobileMenuDrawer = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-[32px] border-t-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden max-h-[85vh] z-[90]"
      >
        <div className="mx-auto w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full my-4" />
        <SheetHeader className="px-6 pb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-teal-200">
              <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} />
              <AvatarFallback>{profile?.full_name?.charAt(0) || 'K'}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <SheetTitle className="text-lg font-bold">{profile?.full_name || 'User'}</SheetTitle>
              <SheetDescription className="text-xs">🎓 Kepala Sekolah • {user?.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="px-6 pb-10 space-y-6">
          <div className="space-y-3 pb-24">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest pl-2">Navigasi Monitoring</p>
            <div className="grid grid-cols-1 gap-2">
              {monitoringNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      isActive ? "bg-teal-600 text-white shadow-lg shadow-teal-500/25" : "bg-slate-100/50 dark:bg-white/5 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold"
                >
                  <Home className="w-5 h-5" />
                  <span>Mode Dasbor Guru</span>
                </Link>
                {profile?.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Panel Admin</span>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="justify-start h-14 rounded-2xl text-red-600 font-bold mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-4" />
                  Keluar Aplikasi
                </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <Sidebar collapsible="icon" className="hidden md:flex">
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
                        <Link href={item.href}>
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
                    <SidebarMenuButton asChild>
                        <Link href="/dashboard" className="flex items-center gap-3 w-full text-teal-600 font-bold">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Mode Dasbor Guru</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                {profile?.role === 'admin' && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-blue-600 font-bold">
                            <Link href="/admin">
                                <Settings className="w-4 h-4 mr-2" />
                                <span>Panel Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                <SidebarSeparator className="my-2" />
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="hover:bg-red-50 hover:text-red-600 rounded-xl">
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Keluar</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-2">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20" />
                     <h1 className="text-lg font-bold tracking-tight">Panel Monitoring</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                        <Bell className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>

      {isMobile && (
          <>
            <MobileMenuDrawer />
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t p-2 flex justify-around items-center h-16 pb-safe">
                <Link href="/monitoring" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/monitoring" ? "text-teal-600 bg-teal-500/10" : "text-muted-foreground")}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Dasbor</span>
                </Link>
                <Link href="/monitoring/teacher-attendance" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/monitoring/teacher-attendance" ? "text-teal-600 bg-teal-500/10" : "text-muted-foreground")}>
                    <UserCheckIcon className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Absensi</span>
                </Link>
                
                <button 
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                  className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg border-4 border-background transition-all active:scale-95"
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
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
                      <path d="M4 12L20 12" className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]" />
                      <path d="M4 12H20" className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45" />
                      <path d="M4 12H20" className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]" />
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
          </>
      )}
    </>
  );
}

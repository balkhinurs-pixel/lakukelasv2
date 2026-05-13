'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  BarChart3,
  BookText,
  CalendarClock,
  ClipboardCheck,
  ClipboardEdit,
  LogOut,
  Settings,
  Users,
  Home,
  Bell,
  CalendarDays,
  ShieldCheck,
  LayoutDashboard,
  PenTool,
  Award,
  ScanLine,
  TrendingUp,
  ClipboardList,
  Link2,
  MapPin,
  CheckCircle2,
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
  useSidebar,
  SidebarTrigger,
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dasbor', color: 'bg-blue-500' },
  { href: '/dashboard/teacher-attendance', icon: MapPin, label: 'Absen Guru', color: 'bg-rose-500' },
  { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda', color: 'bg-amber-500' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi', color: 'bg-emerald-500' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai', color: 'bg-cyan-500' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal', color: 'bg-indigo-500' },
  { href: '/dashboard/materials', icon: Link2, label: 'Materi', color: 'bg-purple-500' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan', color: 'bg-orange-500' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal', color: 'bg-slate-500' },
];

const homeroomNavItems = [
    { href: '/dashboard/homeroom/student-progress', icon: TrendingUp, label: 'Progres', color: 'bg-teal-500' },
    { href: '/dashboard/homeroom/student-ledger', icon: ClipboardList, label: 'Leger', color: 'bg-fuchsia-500' },
    { href: '/dashboard/homeroom/reports', icon: BarChart3, label: 'Raport', color: 'bg-sky-500' },
];

const leftMobileNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/dashboard/attendance', icon: ScanLine, label: 'Presensi' },
];

const rightMobileNavItems = [
    { href: '/dashboard/grades', icon: Award, label: 'Nilai' },
    { href: '/dashboard/journal', icon: PenTool, label: 'Jurnal' },
];

export default function DashboardLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'is_homeroom_teacher' | 'role'> | null
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const isHeadmaster = profile?.role === 'headmaster';
  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const MobileMenuDrawer = () => (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal={false}>
        <SheetContent 
          side="bottom" 
          className="rounded-t-[32px] border-t-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden max-h-[85vh] z-[90] animate-in slide-in-from-bottom duration-300"
        >
          <div className="mx-auto w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full my-4" />
          <SheetHeader className="px-6 pb-4">
            <div className="flex items-center gap-4 text-left">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} />
                <AvatarFallback>{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-lg font-bold truncate">{profile?.full_name || 'Guru'}</SheetTitle>
                <SheetDescription className="text-xs truncate">{user?.email}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(85vh-120px)] px-6 pb-32">
            <div className="space-y-8 pb-32">
              {(isHeadmaster || isAdmin) && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest pl-2">Akses Cepat</p>
                  <Link 
                    href="/monitoring" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-3xl bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold border border-teal-500/20"
                  >
                    <div className="p-2 rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span>Panel Monitoring</span>
                  </Link>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest pl-2">Aplikasi</p>
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden",
                          item.color,
                          isActive ? "ring-4 ring-offset-2 ring-primary/30" : "opacity-90 group-hover:opacity-100"
                        )}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold text-center leading-tight transition-colors",
                          isActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
                        )}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {profile?.is_homeroom_teacher && (
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest pl-2">Menu Wali Kelas</p>
                  <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {homeroomNavItems.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                          item.color,
                          pathname.startsWith(item.href) ? "ring-4 ring-offset-2 ring-orange-500/30" : "opacity-90"
                        )}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold text-center leading-tight",
                          pathname.startsWith(item.href) ? "text-orange-600" : "text-slate-600 dark:text-slate-400"
                        )}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 pb-8">
                <Button asChild variant="secondary" className="h-16 rounded-3xl flex flex-col gap-1 items-center justify-center" onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href="/dashboard/settings">
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-16 rounded-3xl flex flex-col gap-1 items-center justify-center text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Keluar</span>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );

  const ProfileHeader = () => (
    <SidebarHeader className="p-0 text-background">
      <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 via-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          
          <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
            <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} data-ai-hint="teacher portrait" />
            <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
          <div className="text-center relative z-10">
            <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'Guru'}</p>
            <p className="text-sm text-white/80 drop-shadow-sm">{user?.email}</p>
            <div className="mt-2">
              <Badge variant={'outline'} className="text-xs font-semibold backdrop-blur-sm border-white/30 bg-green-500/20 text-green-100 border-green-300/30">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                {isHeadmaster ? 'Kepala Sekolah' : 'Akun Pro'}
              </Badge>
            </div>
          </div>
      </div>
    </SidebarHeader>
  );

  return (
    <>
       <Sidebar className="hidden md:flex">
          <ProfileHeader />
          <SidebarContent className="p-0">
            <ScrollArea className="flex-1">
                {(isHeadmaster || isAdmin) && (
                    <SidebarGroup className="p-4">
                        <SidebarGroupLabel className="text-teal-600 font-semibold text-sm tracking-wider uppercase bg-teal-500/10 px-3 py-2 rounded-lg border border-teal-500/20 mb-4">
                            <LayoutDashboard className="w-4 h-4 mr-2 inline" />
                            Monitoring
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="rounded-xl mx-2 font-bold text-teal-700 bg-teal-50 hover:bg-teal-100">
                                    <Link href="/monitoring">
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Buka Panel Monitoring
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <SidebarGroup className="p-4">
                    <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4">
                        Menu Utama
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-2">
                      {navItems.map((item) => {
                        const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard';
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "rounded-xl mx-2 transition-all duration-300",
                                isActive && "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                              )}
                            >
                              <Link href={item.href}>
                                <item.icon className={cn("w-4 h-4 mr-2", isActive && "text-primary")} />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                </SidebarGroup>
                
                 {profile?.is_homeroom_teacher && (
                    <SidebarGroup className="p-4">
                        <SidebarGroupLabel className="text-orange-600 font-semibold text-sm tracking-wider uppercase bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20 mb-4">
                            Wali Kelas
                        </SidebarGroupLabel>
                        <SidebarMenu className="gap-2">
                          {homeroomNavItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                              <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  className={cn(
                                    "rounded-xl mx-2 transition-all duration-300",
                                    isActive && "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                                  )}
                                >
                                  <Link href={item.href}>
                                    <item.icon className={cn("w-4 h-4 mr-2", isActive && "text-primary")} />
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                          <Link href="/dashboard/settings">
                              <Settings className="w-4 h-4 mr-2" />
                              <span>Pengaturan</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-2">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20" />
                     <h1 className="text-lg font-bold tracking-tight">LakuKelas</h1>
                </div>
                <div className="flex items-center gap-1">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} />
                                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
                                 </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild><Link href="/dashboard/settings">Profil Saya</Link></DropdownMenuItem>
                            {(isHeadmaster || isAdmin) && <DropdownMenuItem asChild><Link href="/monitoring">Panel Monitoring</Link></DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>Keluar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                {leftMobileNavItems.map((item) => (
                    <Link key={item.href} href={item.href} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </Link>
                ))}
                
                <button 
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                  className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-lg border-4 border-background transition-all active:scale-95"
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

                {rightMobileNavItems.map((item) => (
                    <Link key={item.href} href={item.href} className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                    </Link>
                ))}
            </div>
          </>
      )}
    </>
  );
}

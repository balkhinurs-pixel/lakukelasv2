
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
  Home,
  Bell,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
  Link2,
  MapPin,
  CheckCircle2,
  User,
  LayoutGrid
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/teacher-attendance', icon: MapPin, label: 'Absen' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/settings', icon: User, label: 'Profil' },
];

export default function DashboardLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: SupabaseUser | null;
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

  const ProfileHeader = () => (
    <SidebarHeader className="p-0 text-background">
      <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          
          <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
            <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} />
            <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
          <div className="text-center relative z-10">
            <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'Guru'}</p>
            <div className="mt-2">
              <Badge variant={'outline'} className="text-[10px] font-black uppercase tracking-wider backdrop-blur-sm border-white/30 bg-green-500/20 text-green-100">
                PRO ACTIVE
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
          <SidebarContent className="p-0 bg-slate-50">
            <ScrollArea className="flex-1">
                {(isHeadmaster || isAdmin) && (
                    <SidebarGroup className="p-4">
                        <SidebarGroupLabel className="text-teal-600 font-bold text-[10px] tracking-[0.2em] uppercase mb-4">Monitoring</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="rounded-xl font-bold text-teal-700 bg-teal-50 border border-teal-100">
                                    <Link href="/monitoring">
                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                        Dashboard Monitoring
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <SidebarGroup className="p-4">
                    <SidebarGroupLabel className="text-slate-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-4">Aplikasi</SidebarGroupLabel>
                    <SidebarMenu className="gap-2">
                      {[
                        { href: '/dashboard', icon: Home, label: 'Dasbor' },
                        { href: '/dashboard/teacher-attendance', icon: MapPin, label: 'Absen Guru' },
                        { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda' },
                        { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi Siswa' },
                        { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Input Nilai' },
                        { href: '/dashboard/journal', icon: BookText, label: 'Jurnal' },
                        { href: '/dashboard/materials', icon: Link2, label: 'Materi' },
                        { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
                        { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
                      ].map((item) => {
                        const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard';
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "rounded-xl transition-all duration-300",
                                isActive && "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                              )}
                            >
                              <Link href={item.href}>
                                <item.icon className="w-4 h-4 mr-2" />
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
          <SidebarFooter className="p-4 border-t bg-slate-50">
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl h-12" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
              </Button>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset className="bg-[#f8fafc]">
        <header className="sticky top-0 z-40 w-full bg-indigo-600 text-white shadow-lg h-16 shrink-0 flex items-center px-6">
            <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-3">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20 rounded-xl" />
                     <h1 className="text-xl font-black tracking-tight">LakuKelas</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-white/20 mx-2" />
                    <Avatar className="h-9 w-9 border-2 border-white/30">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
      
      {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-[45] pb-safe bg-white border-t rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
            <div className="h-16 flex items-center justify-around px-4 relative">
                {navItems.slice(0, 2).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={cn(
                                "flex flex-col items-center justify-center transition-all",
                                isActive ? "text-indigo-600" : "text-slate-400"
                            )}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest mt-1">{item.label}</span>
                        </Link>
                    )
                })}

                <div className="relative -mt-12 flex flex-col items-center">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-300 flex items-center justify-center transition-transform active:scale-90 border-4 border-white"
                    >
                        <LayoutGrid className="w-6 h-6" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-indigo-600">Menu</span>
                </div>

                {navItems.slice(2, 4).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={cn(
                                "flex flex-col items-center justify-center transition-all",
                                isActive ? "text-indigo-600" : "text-slate-400"
                            )}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest mt-1">{item.label}</span>
                        </Link>
                    )
                })}
            </div>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetContent side="bottom" className="rounded-t-[40px] border-t-0 p-0 overflow-hidden bg-white/95 backdrop-blur-xl h-[80vh]">
                 <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4" />
                 <div className="px-8 pt-4 pb-8 space-y-8 h-full overflow-y-auto">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-indigo-100">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">{profile?.full_name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guru Profesional</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-y-8 gap-x-2">
                        {[
                          { href: '/dashboard', icon: Home, label: 'Home', color: 'bg-blue-500' },
                          { href: '/dashboard/teacher-attendance', icon: MapPin, label: 'Absen', color: 'bg-rose-500' },
                          { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda', color: 'bg-amber-500' },
                          { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi', color: 'bg-emerald-500' },
                          { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai', color: 'bg-cyan-500' },
                          { href: '/dashboard/journal', icon: BookText, label: 'Jurnal', color: 'bg-indigo-500' },
                          { href: '/dashboard/materials', icon: Link2, label: 'Materi', color: 'bg-purple-500' },
                          { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan', color: 'bg-orange-500' },
                          { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal', color: 'bg-slate-500' },
                          { href: '/dashboard/settings', icon: Settings, label: 'Setelan', color: 'bg-slate-400' },
                        ].map((item) => (
                            <Link 
                                key={item.href} 
                                href={item.href} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex flex-col items-center gap-2 transition-transform active:scale-90"
                            >
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wider text-slate-600">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                    
                    <div className="pt-6 border-t">
                        <Button variant="ghost" className="w-full h-14 rounded-2xl text-red-500 font-black tracking-widest uppercase text-xs hover:bg-red-50" onClick={handleLogout}>
                            <LogOut className="w-5 h-5 mr-3" /> Keluar Sesi
                        </Button>
                    </div>
                 </div>
              </SheetContent>
            </Sheet>
          </div>
      )}
    </>
  );
}

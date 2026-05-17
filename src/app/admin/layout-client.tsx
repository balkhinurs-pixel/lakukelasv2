'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LogOut,
  Settings,
  Home,
  ShieldCheck,
  Ticket,
  Users,
  CalendarCheck,
  School,
  BookOpen,
  Users2,
  ArrowRightLeft,
  GraduationCap,
  Building,
  MapPin,
  MessageSquare,
  CalendarClock,
  CalendarOff,
  ChevronLeft,
  LayoutDashboard,
  UserCheck,
  Activity,
  ChevronDown,
  ChevronUp,
  Bell
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
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

export default function AdminLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: SupabaseUser | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'role'> | null
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMonitoringExpanded, setIsMonitoringExpanded] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const NavItem = ({ href, icon: Icon, label, color = "" }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            "rounded-xl transition-all duration-200 h-10",
            isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-100" : "hover:bg-slate-100"
          )}
        >
          <Link href={href}>
            <Icon className={cn("w-4 h-4 mr-2", !isActive && color)} />
            <span className="font-bold">{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const MobileGridItem = ({ href, icon: Icon, label, color }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
        <Link 
            href={href} 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="flex flex-col items-center gap-1.5 transition-transform active:scale-90"
        >
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all",
                color,
                isActive && "ring-2 ring-offset-2 ring-purple-600 scale-105"
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black text-center leading-tight uppercase tracking-wider text-slate-600 line-clamp-2 px-1">
                {label}
            </span>
        </Link>
    );
  };

  return (
    <>
       <Sidebar className="hidden md:flex border-r-purple-100">
          <SidebarHeader className="p-0">
              <div className="bg-gradient-to-br from-purple-800 to-purple-600 p-6 text-white text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                      <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                      <h2 className="font-black text-lg tracking-tight">Panel Admin</h2>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[9px] uppercase tracking-widest mt-1">Superuser Mode</Badge>
                  </div>
              </div>
          </SidebarHeader>
          <SidebarContent className="bg-slate-50">
            <ScrollArea className="flex-1">
                <SidebarGroup className="p-4 pt-6">
                    <SidebarMenu>
                        <SidebarMenuItem className="mb-4">
                            <SidebarMenuButton asChild className="bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl shadow-lg">
                                <Link href="/dashboard">
                                    <ChevronLeft className="w-5 h-5 mr-2" />
                                    <span className="font-black">Kembali ke Guru</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Manajemen Staf</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/codes" icon={Ticket} label="Token Aktivasi" color="text-purple-600" />
                      <NavItem href="/admin/users" icon={Users} label="Staf & Approval" color="text-purple-600" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Data Master Rombel</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/roster/school-year" icon={CalendarCheck} label="Tahun Ajaran" color="text-purple-600" />
                      <NavItem href="/admin/roster/classes" icon={School} label="Data Kelas" color="text-purple-600" />
                      <NavItem href="/admin/roster/subjects" icon={BookOpen} label="Data Mapel" color="text-purple-600" />
                      <NavItem href="/admin/roster/students" icon={Users2} label="Data Siswa" color="text-purple-600" />
                      <NavItem href="/admin/roster/promotion" icon={ArrowRightLeft} label="Promosi Siswa" color="text-purple-600" />
                      <NavItem href="/admin/roster/alumni" icon={GraduationCap} label="Arsip Alumni" color="text-purple-600" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Pengaturan Sistem</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/settings/school" icon={Building} label="Data Sekolah" color="text-purple-600" />
                      <NavItem href="/admin/settings/location" icon={MapPin} label="Setelan Lokasi" color="text-purple-600" />
                      <NavItem href="/admin/settings/whatsapp" icon={MessageSquare} label="WhatsApp API" color="text-purple-600" />
                      <NavItem href="/admin/settings/schedule" icon={CalendarClock} label="Master Jadwal" color="text-purple-600" />
                      <NavItem href="/admin/settings/holidays" icon={CalendarOff} label="Hari Libur" color="text-purple-600" />
                    </SidebarMenu>
                </SidebarGroup>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t bg-slate-50">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 font-bold rounded-xl h-12">
                            <LogOut className="w-4 h-4 mr-2" />
                            Keluar Sesi
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Keluar dari Admin?</AlertDialogTitle>
                            <AlertDialogDescription>Anda perlu login kembali untuk mengakses data.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-row gap-2 pt-4">
                            <AlertDialogCancel className="flex-1 rounded-xl">Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="flex-1 rounded-xl bg-red-600 font-bold">Keluar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset className="bg-[#fcfaff]">
        <header className="sticky top-0 z-40 w-full bg-purple-700 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-3">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20 rounded-xl" />
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase opacity-70 tracking-widest">Administrator</span>
                        <h1 className="text-sm font-bold tracking-tight">LakuKelas Master Panel</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20 font-bold rounded-xl h-10 px-4">
                        <Link href="/dashboard">Panel Guru</Link>
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
            {isMobileMenuOpen && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[35] animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
            )}
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal={false}>
              <SheetContent side="bottom" className="rounded-t-[40px] border-t-0 p-0 overflow-hidden bg-white/95 backdrop-blur-xl h-[85vh] z-[40] animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4" />
                <ScrollArea className="h-full px-6 pt-2 pb-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-2">
                            <Avatar className="h-14 w-14 border-2 border-purple-100 shadow-md">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-purple-600 text-white font-bold">{profile?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight truncate">{profile?.full_name}</h3>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.2em]">Master Admin Mode</p>
                            </div>
                        </div>

                        {/* 1. Monitoring Section (Collapsible) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitoring Kepala</p>
                                <button onClick={() => setIsMonitoringExpanded(!isMonitoringExpanded)} className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-1">
                                    {isMonitoringExpanded ? 'Sembunyikan' : 'Tampilkan'}
                                    {isMonitoringExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            </div>
                            {isMonitoringExpanded && (
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <MobileGridItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="bg-teal-500" />
                                    <MobileGridItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi" color="bg-teal-500" />
                                    <MobileGridItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="bg-teal-500" />
                                </div>
                            )}
                        </div>

                        {/* 2. Admin Menus (Always Grid) */}
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Manajemen Staf</p>
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                    <MobileGridItem href="/admin/codes" icon={Ticket} label="Token" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/users" icon={Users} label="Approval" color="bg-purple-600" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Data Master Rombel</p>
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                    <MobileGridItem href="/admin/roster/school-year" icon={CalendarCheck} label="Tahun Ajaran" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/roster/classes" icon={School} label="Kelas" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/roster/subjects" icon={BookOpen} label="Mapel" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/roster/students" icon={Users2} label="Siswa" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/roster/promotion" icon={ArrowRightLeft} label="Promosi" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/roster/alumni" icon={GraduationCap} label="Alumni" color="bg-purple-600" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Pengaturan Sistem</p>
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                    <MobileGridItem href="/admin/settings/school" icon={Building} label="Sekolah" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/settings/location" icon={MapPin} label="Lokasi" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/settings/whatsapp" icon={MessageSquare} label="WhatsApp" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/settings/schedule" icon={CalendarClock} label="Jadwal" color="bg-purple-600" />
                                    <MobileGridItem href="/admin/settings/holidays" icon={CalendarOff} label="Libur" color="bg-purple-600" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Panel Switcher */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Navigasi Panel</p>
                            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><ChevronLeft className="w-5 h-5" /></div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-black text-sm tracking-tight leading-none">Kembali ke Panel Guru</span>
                                    <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-1">Sistem Administrasi Guru</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Bottom Nav Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white/80 backdrop-blur-xl border-t p-2 flex justify-around items-center h-16 pb-safe">
                <Link href="/admin/users" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/users") ? "text-purple-600 bg-purple-50" : "text-muted-foreground")}>
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Staf</span>
                </Link>
                <div className="flex justify-center h-full items-center">
                    <button 
                      onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                      className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 text-white shadow-lg border-4 border-background transition-all active:scale-95"
                    >
                        <svg className="pointer-events-none" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12L20 12" className="origin-center -translate-y-[7px] transition-all duration-300 group-aria-expanded:rotate-[315deg]" />
                          <path d="M4 12H20" className="origin-center transition-all duration-300 group-aria-expanded:rotate-45" />
                          <path d="M4 12H20" className="origin-center translate-y-[7px] transition-all duration-300 group-aria-expanded:rotate-[135deg]" />
                        </svg>
                    </button>
                </div>
                <Link href="/admin/settings/school" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/settings") ? "text-purple-600 bg-purple-50" : "text-muted-foreground")}>
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Sistem</span>
                </Link>
            </div>
          </>
      )}
    </>
  );
}

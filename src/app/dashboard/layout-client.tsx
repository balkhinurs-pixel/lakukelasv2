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
  Link2,
  MapPin,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Activity,
  UserCheck,
  TrendingUp,
  Table as TableIcon,
  Users,
  PlusCircle,
  FileText,
  Database,
  ChevronUp,
  ChevronLeft,
  FileSearch,
  LineChart,
  User,
  GraduationCap
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
  const [isMonitoringExpanded, setIsMonitoringExpanded] = React.useState(true);
  
  const isHeadmaster = profile?.role === 'headmaster';
  const isAdmin = profile?.role === 'admin';
  const isHomeroom = profile?.is_homeroom_teacher;

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const NavItem = ({ href, icon: Icon, label, color = "" }: any) => {
    const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href) && href !== '/dashboard';
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            "rounded-xl transition-all duration-200 h-10",
            isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "hover:bg-slate-100 text-slate-600"
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
                isActive && "ring-2 ring-offset-2 ring-indigo-600 scale-105"
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
       <Sidebar className="hidden md:flex border-r-indigo-100">
          <SidebarHeader className="p-0">
              <div className="bg-gradient-to-br from-indigo-800 to-indigo-600 p-6 text-white text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                      <GraduationCap className="w-10 h-10" />
                  </div>
                  <div>
                      <h2 className="font-black text-lg tracking-tight">LakuKelas Guru</h2>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[9px] uppercase tracking-widest mt-1">Sistem Administrasi</Badge>
                  </div>
              </div>
          </SidebarHeader>
          
          <SidebarContent className="bg-slate-50">
            <ScrollArea className="flex-1">
                <SidebarGroup className="p-4 pt-6">
                    {isAdmin && (
                        <SidebarMenu className="mb-6">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl shadow-lg">
                                    <Link href="/admin/users">
                                        <ShieldCheck className="w-5 h-5 mr-2" />
                                        <span className="font-black">Buka Master Admin</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )}

                    {(isHeadmaster || isAdmin) && (
                        <>
                            <SidebarGroupLabel className="text-teal-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Monitoring</SidebarGroupLabel>
                            <SidebarMenu className="gap-1 mb-6">
                                <NavItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="text-teal-600" />
                                <NavItem href="/monitoring/weekly-chart" icon={LineChart} label="Grafik Tren" color="text-teal-600" />
                                <NavItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi Guru" color="text-teal-600" />
                                <NavItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="text-teal-600" />
                            </SidebarMenu>
                        </>
                    )}

                    {isHomeroom && (
                        <>
                            <SidebarGroupLabel className="text-emerald-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Wali Kelas</SidebarGroupLabel>
                            <SidebarMenu className="gap-1 mb-6">
                                <NavItem href="/dashboard/homeroom/student-ledger" icon={ClipboardEdit} label="Leger & Catatan" color="text-emerald-600" />
                                <NavItem href="/dashboard/homeroom/student-progress" icon={TrendingUp} label="Progres Siswa" color="text-emerald-600" />
                                <NavItem href="/dashboard/homeroom/reports" icon={TableIcon} label="Lap. Bulanan" color="text-emerald-600" />
                            </SidebarMenu>
                        </>
                    )}

                    <SidebarGroupLabel className="text-indigo-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Menu Utama</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                        <NavItem href="/dashboard" icon={Home} label="Dasbor Guru" color="text-indigo-600" />
                        <NavItem href="/dashboard/teacher-attendance" icon={MapPin} label="Absen Guru" color="text-indigo-600" />
                        <NavItem href="/dashboard/agenda" icon={CalendarDays} label="Agenda Sekolah" color="text-indigo-600" />
                        <NavItem href="/dashboard/attendance" icon={ClipboardCheck} label="Presensi Siswa" color="text-indigo-600" />
                        <NavItem href="/dashboard/grades" icon={ClipboardEdit} label="Input Nilai" color="text-indigo-600" />
                        <NavItem href="/dashboard/journal" icon={BookText} label="Jurnal Mengajar" color="text-indigo-600" />
                        <NavItem href="/dashboard/materials" icon={Link2} label="Materi Belajar" color="text-indigo-600" />
                        <NavItem href="/dashboard/ai-pembelajaran/naskah-soal" icon={FileSearch} label="Naskah Soal" color="text-indigo-600" />
                        <NavItem href="/dashboard/reports" icon={BarChart3} label="Laporan Akademik" color="text-indigo-600" />
                        <NavItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal Mengajar" color="text-indigo-600" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-indigo-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Asisten AI
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        <NavItem href="/dashboard/ai-pembelajaran/bank-soal" icon={Database} label="Bank Soal AI" color="text-indigo-600" />
                        <NavItem href="/dashboard/ai-pembelajaran/modul-ajar" icon={FileText} label="Modul Ajar" color="text-indigo-600" />
                        <NavItem href="/dashboard/ai-pembelajaran/generate-soal" icon={PlusCircle} label="Generate Soal" color="text-indigo-600" />
                    </SidebarMenu>
                </SidebarGroup>
            </ScrollArea>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t bg-slate-50">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-indigo-600 text-white font-bold">{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">{profile?.full_name?.split(',')[0]}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{profile?.role}</p>
                    </div>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 font-bold rounded-xl h-10">
                            <LogOut className="w-4 h-4 mr-2" />
                            Keluar Sesi
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Keluar dari LakuKelas?</AlertDialogTitle>
                            <AlertDialogDescription>Aktivitas mengajar Anda akan diakhiri secara aman.</AlertDialogDescription>
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
        <header className="sticky top-0 z-40 w-full bg-indigo-700 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-3">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20 rounded-xl" />
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase opacity-70 tracking-widest">Dashboard</span>
                        <h1 className="text-sm font-bold tracking-tight">Administrasi Guru</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" asChild>
                        <Link href="/dashboard/settings"><Settings className="h-5 w-5" /></Link>
                    </Button>
                    <div className="h-8 w-px bg-white/20 mx-2" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-red-500 transition-colors rounded-full">
                              <LogOut className="h-5 w-5" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                          <AlertDialogHeader>
                              <AlertDialogTitle>Keluar Sesi?</AlertDialogTitle>
                              <AlertDialogDescription>Pastikan seluruh data hari ini telah tersimpan.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex flex-row gap-2 pt-4">
                              <AlertDialogCancel className="flex-1 rounded-xl h-12">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handleLogout} className="flex-1 rounded-xl h-12 bg-red-600 font-bold">Keluar</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                <ScrollArea className="h-full px-6 pt-2 pb-32">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-2">
                            <Avatar className="h-14 w-14 border-2 border-indigo-100 shadow-md">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-indigo-600 text-white font-bold">{profile?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight truncate">{profile?.full_name}</h3>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Dashboard Guru Aktif</p>
                            </div>
                        </div>

                        {(isHeadmaster || isAdmin) && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">Monitoring</p>
                                <button onClick={() => setIsMonitoringExpanded(!isMonitoringExpanded)} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                                    {isMonitoringExpanded ? 'Sembunyikan' : 'Tampilkan'}
                                    {isMonitoringExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            </div>
                            {isMonitoringExpanded && (
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2 animate-in fade-in duration-300">
                                    <MobileGridItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="bg-blue-600" />
                                    <MobileGridItem href="/monitoring/weekly-chart" icon={LineChart} label="Grafik Tren" color="bg-rose-500" />
                                    <MobileGridItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi Guru" color="bg-amber-500" />
                                    <MobileGridItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="bg-emerald-500" />
                                </div>
                            )}
                          </div>
                        )}

                        {isHomeroom && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] px-1">Wali Kelas</p>
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard/homeroom/student-ledger" icon={ClipboardEdit} label="Leger" color="bg-blue-500" />
                                <MobileGridItem href="/dashboard/homeroom/student-progress" icon={TrendingUp} label="Progres" color="bg-indigo-500" />
                                <MobileGridItem href="/dashboard/homeroom/reports" icon={TableIcon} label="Bulanan" color="bg-purple-500" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Menu Utama</p>
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard" icon={Home} label="Dasbor" color="bg-pink-500" />
                                <MobileGridItem href="/dashboard/teacher-attendance" icon={MapPin} label="Absen Guru" color="bg-rose-600" />
                                <MobileGridItem href="/dashboard/agenda" icon={CalendarDays} label="Agenda" color="bg-amber-600" />
                                <MobileGridItem href="/dashboard/attendance" icon={ClipboardCheck} label="Presensi" color="bg-emerald-600" />
                                <MobileGridItem href="/dashboard/grades" icon={ClipboardEdit} label="Nilai" color="bg-cyan-500" />
                                <MobileGridItem href="/dashboard/journal" icon={BookText} label="Jurnal" color="bg-indigo-600" />
                                <MobileGridItem href="/dashboard/materials" icon={Link2} label="Materi" color="bg-purple-600" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/naskah-soal" icon={FileSearch} label="Naskah" color="bg-indigo-600" />
                                <MobileGridItem href="/dashboard/reports" icon={BarChart3} label="Laporan" color="bg-orange-500" />
                                <MobileGridItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal" color="bg-slate-600" />
                            </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Asisten AI</p>
                          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard/ai-pembelajaran/bank-soal" icon={Database} label="Bank Soal" color="bg-indigo-700" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/modul-ajar" icon={FileText} label="Modul" color="bg-blue-700" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/generate-soal" icon={PlusCircle} label="Gen Soal" color="bg-emerald-700" />
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Navigasi Panel</p>
                            <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><ShieldCheck className="w-5 h-5" /></div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-black text-sm tracking-tight leading-none">Buka Master Admin</span>
                                    <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-1">Manajemen Sistem</span>
                                </div>
                            </Link>
                          </div>
                        )}
                    </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white/80 backdrop-blur-xl border-t flex items-center h-16 pb-safe">
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/dashboard" ? "text-indigo-600 bg-indigo-50" : "text-muted-foreground")}>
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Dasbor</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard/teacher-attendance" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/dashboard/teacher-attendance") ? "text-indigo-600 bg-indigo-50" : "text-muted-foreground")}>
                        <MapPin className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Absen</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center items-center">
                    <button 
                      onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                      className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-700 to-indigo-500 text-white shadow-lg border-4 border-background transition-all active:scale-95"
                    >
                        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12L20 12" className={cn("origin-center transition-all duration-300", isMobileMenuOpen ? "rotate-[315deg] translate-y-0" : "-translate-y-[7px]")} />
                          <path d="M4 12H20" className={cn("origin-center transition-all duration-300", isMobileMenuOpen ? "rotate-45" : "")} />
                          <path d="M4 12H20" className={cn("origin-center transition-all duration-300", isMobileMenuOpen ? "rotate-[135deg] translate-y-0" : "translate-y-[7px]")} />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard/reports" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/dashboard/reports") ? "text-indigo-600 bg-indigo-50" : "text-muted-foreground")}>
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Laporan</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard/settings" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/dashboard/settings" ? "text-indigo-600 bg-indigo-50" : "text-muted-foreground")}>
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Setelan</span>
                    </Link>
                </div>
            </div>
          </>
      )}
    </>
  );
}

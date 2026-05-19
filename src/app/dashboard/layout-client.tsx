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
  User
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
            "rounded-xl transition-all duration-300 h-11 px-4 mb-0.5",
            isActive 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50" 
              : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
          )}
        >
          <Link href={href}>
            <Icon className={cn("w-4.5 h-4.5 mr-3 transition-transform duration-300", isActive && "scale-110")} />
            <span className="font-bold tracking-tight">{label}</span>
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

  const ProfileHeader = () => (
    <SidebarHeader className="p-6 border-b border-indigo-50/50 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-3">
          <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 rounded-full animate-pulse" />
              <Avatar className="h-11 w-11 border-2 border-white shadow-xl relative z-10">
                <AvatarImage src={(profile?.avatar_url || "")} alt={profile?.full_name || 'Guru'} />
                <AvatarFallback className="bg-indigo-600 text-white font-black text-sm">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
              </Avatar>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900 leading-tight truncate uppercase tracking-tight">{profile?.full_name?.split(',')[0] || 'Guru'}</p>
            <Badge variant="outline" className="mt-1 h-5 px-1.5 border-indigo-100 bg-indigo-50/50 text-indigo-600 text-[9px] font-black uppercase tracking-widest leading-none">
              {profile?.role || 'TEACHER'}
            </Badge>
          </div>
      </div>
    </SidebarHeader>
  );

  return (
    <>
       <Sidebar className="hidden md:flex border-r border-indigo-50 bg-white/60 backdrop-blur-2xl">
          <ProfileHeader />
          <SidebarContent className="p-0">
            <ScrollArea className="flex-1">
                {(isHeadmaster || isAdmin) && (
                    <SidebarGroup className="p-4 pb-2">
                        <SidebarGroupLabel className="text-teal-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3 ml-2">Monitoring</SidebarGroupLabel>
                        <SidebarMenu className="gap-0.5">
                          <NavItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="text-teal-600" />
                          <NavItem href="/monitoring/weekly-chart" icon={LineChart} label="Grafik Tren" color="text-teal-600" />
                          <NavItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi Guru" color="text-teal-600" />
                          <NavItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="text-teal-600" />
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {isHomeroom && (
                  <SidebarGroup className="p-4 py-2">
                      <SidebarGroupLabel className="text-emerald-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3 ml-2">Wali Kelas</SidebarGroupLabel>
                      <SidebarMenu className="gap-0.5">
                        <NavItem href="/dashboard/homeroom/student-ledger" icon={ClipboardEdit} label="Leger & Catatan" color="text-emerald-600" />
                        <NavItem href="/dashboard/homeroom/student-progress" icon={TrendingUp} label="Progres" color="text-emerald-600" />
                        <NavItem href="/dashboard/homeroom/reports" icon={TableIcon} label="Lap. Bulanan" color="text-emerald-600" />
                      </SidebarMenu>
                  </SidebarGroup>
                )}

                <SidebarGroup className="p-4 py-2">
                    <SidebarGroupLabel className="text-slate-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3 ml-2">Utama</SidebarGroupLabel>
                    <SidebarMenu className="gap-0.5">
                      <NavItem href="/dashboard" icon={Home} label="Dasbor" />
                      <NavItem href="/dashboard/teacher-attendance" icon={MapPin} label="Absen Guru" color="text-rose-500" />
                      <NavItem href="/dashboard/agenda" icon={CalendarDays} label="Agenda" color="text-amber-500" />
                      <NavItem href="/dashboard/attendance" icon={ClipboardCheck} label="Presensi Siswa" color="text-emerald-500" />
                      <NavItem href="/dashboard/grades" icon={ClipboardEdit} label="Input Nilai" color="text-cyan-500" />
                      <NavItem href="/dashboard/journal" icon={BookText} label="Jurnal" color="text-indigo-500" />
                      <NavItem href="/dashboard/materials" icon={Link2} label="Materi" color="text-purple-500" />
                      <NavItem href="/dashboard/ai-pembelajaran/naskah-soal" icon={FileSearch} label="Naskah Soal" color="text-indigo-600" />
                      <NavItem href="/dashboard/reports" icon={BarChart3} label="Laporan" color="text-orange-500" />
                      <NavItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal" color="text-slate-500" />
                      <NavItem href="/dashboard/settings" icon={Settings} label="Setelan" color="text-slate-400" />
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="p-4 py-2">
                    <SidebarGroupLabel className="text-indigo-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3 ml-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Asisten AI
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-0.5">
                      <NavItem href="/dashboard/ai-pembelajaran/bank-soal" icon={Database} label="Bank Soal AI" color="text-indigo-600" />
                      <NavItem href="/dashboard/ai-pembelajaran/modul-ajar" icon={FileText} label="Modul Ajar" color="text-indigo-600" />
                      <NavItem href="/dashboard/ai-pembelajaran/generate-soal" icon={PlusCircle} label="Generate Soal" color="text-indigo-600" />
                    </SidebarMenu>
                </SidebarGroup>

                {isAdmin && (
                  <SidebarGroup className="p-4 pt-2">
                      <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3 ml-2">Sistem</SidebarGroupLabel>
                      <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 font-black h-12 rounded-2xl border border-indigo-100 shadow-sm transition-all duration-300">
                                <Link href="/admin/users">
                                    <ShieldCheck className="w-5 h-5 mr-3" />
                                    <span>Master Admin</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                  </SidebarGroup>
                )}
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-indigo-50/50">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold rounded-xl h-12 transition-all">
                          <LogOut className="w-4 h-4 mr-3" />
                          Keluar Sesi
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-8">
                      <AlertDialogHeader className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                              <LogOut className="h-8 w-8" />
                          </div>
                          <AlertDialogTitle className="text-2xl font-black tracking-tight text-center">Keluar Sesi?</AlertDialogTitle>
                          <AlertDialogDescription className="text-center font-medium text-slate-500">Aktivitas mengajar Anda akan diakhiri secara aman.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-row gap-3 pt-6">
                          <AlertDialogCancel className="flex-1 rounded-2xl h-14 font-bold border-slate-100 hover:bg-slate-50">Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout} className="flex-1 rounded-2xl h-14 bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest shadow-lg shadow-rose-100">Keluar</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset className="bg-[#F8FAFF]">
        <div className="sticky top-4 z-40 w-[calc(100%-2rem)] mx-auto mb-2 pointer-events-none md:pointer-events-auto">
            <header className="h-16 px-6 bg-indigo-700/80 backdrop-blur-xl text-white shadow-2xl shadow-indigo-100/50 rounded-2xl border border-white/20 flex items-center justify-between pointer-events-auto overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20 rounded-xl w-10 h-10 transition-colors" />
                     <div className="h-8 w-px bg-white/20 hidden md:block" />
                     <div className="flex flex-col">
                        <h1 className="text-lg font-black tracking-tight leading-none">LakuKelas</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">Management System</p>
                     </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-10 h-10">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-white/20 mx-2" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-rose-500 hover:text-white transition-all rounded-full w-10 h-10 group">
                              <LogOut className="h-5 w-5 group-hover:scale-110" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-8">
                          <AlertDialogHeader className="space-y-4">
                              <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                  <LogOut className="h-8 w-8" />
                              </div>
                              <AlertDialogTitle className="text-2xl font-black tracking-tight text-center text-slate-900">Akhiri Sesi?</AlertDialogTitle>
                              <AlertDialogDescription className="text-center font-medium text-slate-500">Pastikan semua data administrasi Anda telah tersimpan.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex flex-row gap-3 pt-6">
                              <AlertDialogCancel className="flex-1 rounded-2xl h-14 font-bold border-slate-100">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={handleLogout} className="flex-1 rounded-2xl h-14 bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest shadow-lg">Keluar</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>
        </div>

        <div className="p-4 sm:p-6 lg:p-10 pt-4">
            {children}
        </div>
      </SidebarInset>
      
      {isMobile && (
          <>
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[35] animate-in fade-in duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal={false}>
              <SheetContent 
                side="bottom" 
                className="rounded-t-[40px] border-t-0 p-0 overflow-hidden bg-white/95 backdrop-blur-xl h-[85vh] z-[40] animate-in slide-in-from-bottom duration-300"
              >
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
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{profile?.role?.toUpperCase()}</p>
                            </div>
                        </div>

                        {(isHeadmaster || isAdmin) && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">Monitoring Kepala</p>
                                <button 
                                    onClick={() => setIsMonitoringExpanded(!isMonitoringExpanded)}
                                    className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"
                                >
                                    {isMonitoringExpanded ? 'Sembunyikan' : 'Tampilkan'}
                                    {isMonitoringExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            </div>
                            {isMonitoringExpanded && (
                                <div className="grid grid-cols-4 gap-y-4 gap-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <MobileGridItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="bg-blue-600" />
                                    <MobileGridItem href="/monitoring/weekly-chart" icon={LineChart} label="Grafik Mingguan" color="bg-rose-500" />
                                    <MobileGridItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi" color="bg-amber-500" />
                                    <MobileGridItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="bg-emerald-500" />
                                </div>
                            )}
                          </div>
                        )}

                        {isHomeroom && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] px-1">Menu Wali Kelas</p>
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard/homeroom/student-ledger" icon={ClipboardEdit} label="Leger" color="bg-blue-500" />
                                <MobileGridItem href="/dashboard/homeroom/student-progress" icon={TrendingUp} label="Progres" color="bg-indigo-500" />
                                <MobileGridItem href="/dashboard/homeroom/reports" icon={TableIcon} label="Bulanan" color="bg-purple-500" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Dashboard Guru</p>
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard" icon={Home} label="Dasbor" color="bg-pink-500" />
                                <MobileGridItem href="/dashboard/teacher-attendance" icon={MapPin} label="Absen" color="bg-rose-600" />
                                <MobileGridItem href="/dashboard/agenda" icon={CalendarDays} label="Agenda" color="bg-amber-600" />
                                <MobileGridItem href="/dashboard/attendance" icon={ClipboardCheck} label="Presensi" color="bg-emerald-600" />
                                <MobileGridItem href="/dashboard/grades" icon={ClipboardEdit} label="Nilai" color="bg-cyan-500" />
                                <MobileGridItem href="/dashboard/journal" icon={BookText} label="Jurnal" color="bg-indigo-600" />
                                <MobileGridItem href="/dashboard/materials" icon={Link2} label="Materi" color="bg-purple-600" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/naskah-soal" icon={FileSearch} label="Naskah" color="bg-indigo-600" />
                                <MobileGridItem href="/dashboard/reports" icon={BarChart3} label="Laporan" color="bg-orange-500" />
                                <MobileGridItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal" color="bg-slate-600" />
                                <MobileGridItem href="/dashboard/settings" icon={Settings} label="Setelan" color="bg-slate-400" />
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
                          <div className="space-y-2 pt-2">
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Panel Admin</p>
                            <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3.5 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-200 active:scale-95 transition-all">
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

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t flex items-center h-16 pb-safe">
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/dashboard" ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Dasbor</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard/teacher-attendance" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/dashboard/teacher-attendance") ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                        <MapPin className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium text-center leading-tight">Absen Guru</span>
                    </Link>
                </div>
                
                <div className="flex-1 flex justify-center items-center">
                    <button 
                      onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                      className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg border-4 border-background transition-all active:scale-95"
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
                          <path d="M4 12H20" className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard/reports" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/dashboard/reports") ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium text-center leading-tight">Laporan</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center">
                    <Link href="/dashboard/settings" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/dashboard/settings" ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Profil</span>
                    </Link>
                </div>
            </div>
          </>
      )}
    </>
  );
}

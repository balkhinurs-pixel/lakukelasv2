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
  ChevronRight,
  FileSearch,
  LineChart,
  User,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  LifeBuoy,
  Wand2,
  FolderSearch,
  GitBranchPlus,
  Network,
  BookOpen
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
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
    const { state } = useSidebar();
    const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href) && href !== '/dashboard';
    
    // Pastikan status collapsed hanya aktif setelah mounted untuk menghindari hydration mismatch
    const isCollapsed = mounted ? state === "collapsed" : false;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={label}
          className={cn(
            "rounded-xl transition-all duration-300 h-11 mb-1 group/item relative",
            isActive 
              ? "bg-white text-indigo-700 shadow-lg scale-[1.02]" 
              : "hover:bg-white/10 text-indigo-100/70 hover:text-white",
            isCollapsed && isActive && "rounded-r-none rounded-l-2xl translate-x-1"
          )}
        >
          <Link href={href} className={cn(
            "flex items-center w-full",
            isCollapsed ? "justify-center" : "justify-start px-2"
          )}>
            <Icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300", 
                isActive ? "text-indigo-600" : color,
                !isActive && "group-hover/item:scale-110",
                (!isCollapsed && mounted) && "mr-3"
            )} />
            <AnimatePresence mode="wait">
              {(!isCollapsed && mounted) && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
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

  const SidebarToggle = () => {
    const { toggleSidebar, state } = useSidebar();
    const isCollapsed = mounted ? state === 'collapsed' : false;
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-3 top-20 bg-indigo-700 text-white border-2 border-indigo-800 shadow-xl rounded-full z-50 h-6 w-6 hover:bg-indigo-600 transition-colors"
        >
            {!isCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
    )
  }

  return (
    <>
       <Sidebar 
          collapsible="icon" 
          className="hidden md:flex h-screen border-r border-indigo-900/50 overflow-visible bg-indigo-800"
       >
          <SidebarHeader className="p-0 shrink-0 overflow-hidden bg-indigo-700">
              <div className="p-6 text-white text-center space-y-4 group-data-[collapsible=icon]:p-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:rounded-lg">
                      <GraduationCap className="w-7 h-7 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5" />
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-top-1 duration-300">
                      <h2 className="font-black text-lg tracking-tight">LakuKelas</h2>
                      <Badge variant="outline" className="bg-white/5 text-indigo-100 border-white/10 text-[9px] uppercase tracking-widest mt-1">Dashboard Guru</Badge>
                  </div>
              </div>
          </SidebarHeader>
          
          <SidebarToggle />

          <SidebarContent className="px-3 bg-indigo-800">
            <ScrollArea className="flex-1">
                <SidebarGroup className="p-2 pt-4">
                    {isAdmin && (
                        <SidebarMenu className="mb-6">
                            <SidebarMenuItem>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton asChild className="bg-white/10 text-white hover:bg-white/20 h-12 rounded-xl shadow-lg group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                                                <Link href="/admin/users">
                                                    <ShieldCheck className="w-5 h-5 shrink-0" />
                                                    <span className="font-black group-data-[collapsible=icon]:hidden ml-2">Master Admin</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="md:hidden">Admin Panel</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    )}

                    {(isHeadmaster || isAdmin) && (
                        <>
                            <SidebarGroupLabel className="text-teal-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Monitoring</SidebarGroupLabel>
                            <SidebarMenu className="gap-1 mb-6">
                                <NavItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="text-teal-400" />
                                <NavItem href="/monitoring/weekly-chart" icon={LineChart} label="Grafik Tren" color="text-teal-400" />
                                <NavItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi Guru" color="text-teal-400" />
                                <NavItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="text-teal-400" />
                            </SidebarMenu>
                        </>
                    )}

                    {isHomeroom && (
                        <>
                            <SidebarGroupLabel className="text-emerald-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Wali Kelas</SidebarGroupLabel>
                            <SidebarMenu className="gap-1 mb-6">
                                <NavItem href="/dashboard/homeroom/student-ledger" icon={ClipboardEdit} label="Leger & Catatan" color="text-emerald-400" />
                                <NavItem href="/dashboard/homeroom/reports" icon={TableIcon} label="Laporan Bulanan" color="text-emerald-400" />
                            </SidebarMenu>
                        </>
                    )}

                    <SidebarGroupLabel className="text-indigo-200 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Menu Utama</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                        <NavItem href="/dashboard" icon={Home} label="Dasbor" color="text-indigo-200" />
                        <NavItem href="/dashboard/teacher-attendance" icon={MapPin} label="Absen Guru" color="text-indigo-200" />
                        <NavItem href="/dashboard/agenda" icon={CalendarDays} label="Agenda Sekolah" color="text-indigo-200" />
                        <NavItem href="/dashboard/attendance" icon={ClipboardCheck} label="Presensi Siswa" color="text-indigo-200" />
                        <NavItem href="/dashboard/grades" icon={ClipboardEdit} label="Input Nilai" color="text-indigo-200" />
                        <NavItem href="/dashboard/journal" icon={BookText} label="Jurnal Mengajar" color="text-indigo-200" />
                        <NavItem href="/dashboard/materials" icon={Link2} label="Materi Belajar" color="text-indigo-200" />
                        <NavItem href="/dashboard/reports" icon={BarChart3} label="Laporan Akademik" color="text-indigo-200" />
                        <NavItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal Mengajar" color="text-indigo-200" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-amber-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3 flex items-center gap-2 px-3 group-data-[collapsible=icon]:hidden opacity-70">
                        <Wand2 className="w-3 h-3" /> AI Generator
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                        <NavItem href="/dashboard/ai-pembelajaran/generate-cp-atp" icon={GitBranchPlus} label="Generate CP & ATP" color="text-amber-400" />
                        <NavItem href="/dashboard/ai-pembelajaran/modul-ajar" icon={FileText} label="Generate RPP" color="text-amber-400" />
                        <NavItem href="/dashboard/ai-pembelajaran/generate-soal" icon={PlusCircle} label="Generate Soal" color="text-amber-400" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-sky-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3 flex items-center gap-2 px-3 group-data-[collapsible=icon]:hidden opacity-70">
                        <FolderSearch className="w-3 h-3" /> Arsip Administrasi
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        <NavItem href="/dashboard/ai-pembelajaran/arsip-cp-atp" icon={Network} label="Daftar CP & ATP" color="text-sky-400" />
                        <NavItem href="/dashboard/ai-pembelajaran/bank-soal" icon={Database} label="Bank Soal AI" color="text-sky-400" />
                        <NavItem href="/dashboard/ai-pembelajaran/naskah-soal" icon={FileSearch} label="Daftar Naskah Soal" color="text-sky-400" />
                        <NavItem href="/dashboard/ai-pembelajaran/arsip-rpp" icon={BookOpen} label="Daftar RPP & Modul" color="text-sky-400" />
                    </SidebarMenu>
                </SidebarGroup>
            </ScrollArea>
          </SidebarContent>

          <SidebarFooter className="p-4 pt-0 shrink-0 bg-indigo-900/50 border-t border-white/5">
                <SidebarMenu className="gap-1 mb-4 pt-4">
                    <NavItem href="/dashboard/settings" icon={Settings} label="Setelan Akun" color="text-indigo-300" />
                </SidebarMenu>

                <div className="flex items-center gap-3 px-2 mb-4 group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-8 w-8 border border-white/10 shadow-sm shrink-0">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-indigo-600 text-white font-bold text-[10px]">{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="text-[11px] font-black text-white truncate">{profile?.full_name?.split(',')[0]}</p>
                        <p className="text-[8px] font-bold text-indigo-300/60 uppercase tracking-widest">{profile?.role}</p>
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-rose-400 hover:bg-rose-50/10 font-bold rounded-xl h-10 px-3 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center transition-colors">
                            <LogOut className="w-5 h-5 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden ml-3">Keluar</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Keluar dari LakuKelas?</AlertDialogTitle>
                            <AlertDialogDescription>Sesi mengajar Anda akan diakhiri secara aman.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-row gap-2 pt-4">
                            <AlertDialogCancel className="flex-1 rounded-xl">Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="flex-1 rounded-xl bg-red-600 font-bold">Keluar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset className="bg-transparent overflow-hidden">
        <header className="sticky top-0 z-40 w-full bg-indigo-700 text-white shadow-md border-b border-indigo-800">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                 <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <h1 className="text-base font-black tracking-tight leading-none">LakuKelas</h1>
                        <span className="text-[10px] font-black uppercase text-indigo-100/60 tracking-widest mt-1">Sistem Administrasi Guru</span>
                     </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full transition-colors relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-indigo-700" />
                    </Button>
                    <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-rose-500 hover:text-white transition-all rounded-full">
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
        <div className="p-4 sm:p-6 lg:p-8 bg-[#fcfaff] min-h-screen">
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
                                <AvatarFallback className="bg-indigo-600 text-white font-bold">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight truncate">{profile?.full_name}</h3>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Dashboard Guru Aktif</p>
                            </div>
                        </div>

                        {(isHeadmaster || isAdmin) && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Monitoring</p>
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
                                <MobileGridItem href="/dashboard/reports" icon={BarChart3} label="Laporan" color="bg-orange-500" />
                                <MobileGridItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal" color="bg-slate-600" />
                            </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Wand2 className="w-3 h-3" /> AI Generator</p>
                          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard/ai-pembelajaran/generate-cp-atp" icon={GitBranchPlus} label="Gen CP/ATP" color="bg-indigo-600" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/modul-ajar" icon={FileText} label="Gen RPP" color="bg-purple-700" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/generate-soal" icon={PlusCircle} label="Gen Soal" color="bg-emerald-700" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><FolderSearch className="w-3 h-3" /> Arsip Administrasi</p>
                          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                <MobileGridItem href="/dashboard/ai-pembelajaran/arsip-cp-atp" icon={Network} label="CP & ATP" color="bg-indigo-800" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/bank-soal" icon={Database} label="Bank Soal" color="bg-indigo-700" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/naskah-soal" icon={FileSearch} label="Naskah" color="bg-blue-600" />
                                <MobileGridItem href="/dashboard/ai-pembelajaran/arsip-rpp" icon={BookOpen} label="RPP & Modul" color="bg-indigo-600" />
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

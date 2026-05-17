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
  ChevronUp
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
            "rounded-xl transition-all duration-200",
            isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "hover:bg-slate-100"
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

  const ProfileHeader = () => (
    <SidebarHeader className="p-0 text-background">
      <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          
          <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 relative z-10">
            <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} />
            <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
          <div className="text-center relative z-10">
            <p className="text-lg font-bold text-white drop-shadow-sm line-clamp-1">{profile?.full_name || 'Guru'}</p>
            <div className="mt-2">
              <Badge variant={'outline'} className="text-[10px] font-black uppercase tracking-wider backdrop-blur-sm border-white/30 bg-green-500/20 text-green-100">
                {profile?.role?.toUpperCase() || 'TEACHER'}
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
                    <SidebarGroup className="p-4 pb-2">
                        <SidebarGroupLabel className="text-teal-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Monitoring Kepala</SidebarGroupLabel>
                        <SidebarMenu className="gap-1">
                          <NavItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="text-teal-600" />
                          <NavItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi Guru" color="text-teal-600" />
                          <NavItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas Staf" color="text-teal-600" />
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {isHomeroom && (
                  <SidebarGroup className="p-4 py-2">
                      <SidebarGroupLabel className="text-emerald-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Menu Wali Kelas</SidebarGroupLabel>
                      <SidebarMenu className="gap-1">
                        <NavItem href="/dashboard/homeroom/student-ledger" icon={ClipboardEdit} label="Leger & Catatan" color="text-emerald-600" />
                        <NavItem href="/dashboard/homeroom/student-progress" icon={TrendingUp} label="Progres Siswa" color="text-emerald-600" />
                        <NavItem href="/dashboard/homeroom/reports" icon={TableIcon} label="Laporan Bulanan" color="text-emerald-600" />
                      </SidebarMenu>
                  </SidebarGroup>
                )}

                <SidebarGroup className="p-4 py-2">
                    <SidebarGroupLabel className="text-slate-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Dashboard Guru</SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                      <NavItem href="/dashboard" icon={Home} label="Dasbor" />
                      <NavItem href="/dashboard/teacher-attendance" icon={MapPin} label="Absen Guru" color="text-rose-500" />
                      <NavItem href="/dashboard/agenda" icon={CalendarDays} label="Agenda" color="text-amber-500" />
                      <NavItem href="/dashboard/attendance" icon={ClipboardCheck} label="Presensi Siswa" color="text-emerald-500" />
                      <NavItem href="/dashboard/grades" icon={ClipboardEdit} label="Input Nilai" color="text-cyan-500" />
                      <NavItem href="/dashboard/journal" icon={BookText} label="Jurnal" color="text-indigo-500" />
                      <NavItem href="/dashboard/materials" icon={Link2} label="Materi" color="text-purple-500" />
                      <NavItem href="/dashboard/reports" icon={BarChart3} label="Laporan" color="text-orange-500" />
                      <NavItem href="/dashboard/schedule" icon={CalendarClock} label="Jadwal" color="text-slate-500" />
                      <NavItem href="/dashboard/settings" icon={Settings} label="Setelan" color="text-slate-400" />
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="p-4 py-2">
                    <SidebarGroupLabel className="text-indigo-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Asisten AI</SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                      <NavItem href="/dashboard/ai-pembelajaran/bank-soal" icon={Database} label="Bank Soal AI" color="text-indigo-600" />
                      <NavItem href="/dashboard/ai-pembelajaran/modul-ajar" icon={FileText} label="Modul Ajar" color="text-indigo-600" />
                      <NavItem href="/dashboard/ai-pembelajaran/lkpd" icon={ClipboardEdit} label="Pembuatan LKPD" color="text-indigo-600" />
                      <NavItem href="/dashboard/ai-pembelajaran/generate-soal" icon={PlusCircle} label="Generate Soal" color="text-indigo-600" />
                    </SidebarMenu>
                </SidebarGroup>

                {isAdmin && (
                  <SidebarGroup className="p-4 pt-2">
                      <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Panel Admin</SidebarGroupLabel>
                      <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-black h-12 rounded-xl border border-purple-100 shadow-sm">
                                <Link href="/admin/users">
                                    <ShieldCheck className="w-5 h-5 mr-2" />
                                    <span>Buka Panel Admin</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                  </SidebarGroup>
                )}
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t bg-slate-50">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl h-12">
                          <LogOut className="w-4 h-4 mr-2" />
                          Keluar Sesi
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                      <AlertDialogHeader>
                          <AlertDialogTitle>Keluar dari LakuKelas?</AlertDialogTitle>
                          <AlertDialogDescription>Sesi mengajar Anda akan diakhiri secara aman.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex flex-row gap-2 pt-4">
                          <AlertDialogCancel className="flex-1 rounded-xl h-12">Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout} className="flex-1 rounded-xl h-12 bg-red-600 font-bold">Ya, Keluar</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset className="bg-[#f8fafc]">
        <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-3">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20 rounded-xl" />
                     <h1 className="text-lg font-bold tracking-tight">LakuKelas</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-white/20 mx-2" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-red-500 hover:text-white transition-colors rounded-full">
                              <LogOut className="h-5 w-5" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                          <AlertDialogHeader>
                              <AlertDialogTitle>Keluar Sesi?</AlertDialogTitle>
                              <AlertDialogDescription>Anda perlu login kembali untuk mengakses data.</AlertDialogDescription>
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
                <ScrollArea className="h-full px-6 pt-2 pb-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-2">
                            <Avatar className="h-14 w-14 border-2 border-indigo-100 shadow-md">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
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
                                    {[
                                      { href: '/monitoring', icon: LayoutDashboard, label: 'Statistik', color: 'bg-teal-500' },
                                      { href: '/monitoring/teacher-attendance', icon: UserCheck, label: 'Absensi', color: 'bg-teal-500' },
                                      { href: '/monitoring/teacher-activity', icon: Activity, label: 'Aktivitas', color: 'bg-teal-500' },
                                    ].map((item) => (
                                        <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-2 transition-transform active:scale-90">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wider text-slate-600">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                          </div>
                        )}

                        {isHomeroom && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] px-1">Menu Wali Kelas</p>
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                {[
                                  { href: '/dashboard/homeroom/student-ledger', icon: ClipboardEdit, label: 'Leger', color: 'bg-emerald-500' },
                                  { href: '/dashboard/homeroom/student-progress', icon: TrendingUp, label: 'Progres', color: 'bg-emerald-500' },
                                  { href: '/dashboard/homeroom/reports', icon: TableIcon, label: 'Bulanan', color: 'bg-emerald-500' },
                                ].map((item) => (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-2 transition-transform active:scale-90">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wider text-slate-600">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Dashboard Guru</p>
                            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                                {[
                                  { href: '/dashboard', icon: Home, label: 'Dasbor', color: 'bg-blue-500' },
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
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-2 transition-transform active:scale-90">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wider text-slate-600">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1 flex items-center gap-2"><Sparkles className="w-3 h-3" /> Asisten AI</p>
                          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                             {[
                                { href: '/dashboard/ai-pembelajaran/bank-soal', icon: Database, label: 'Bank Soal', color: 'bg-indigo-600' },
                                { href: '/dashboard/ai-pembelajaran/modul-ajar', icon: FileText, label: 'Modul', color: 'bg-indigo-600' },
                                { href: '/dashboard/ai-pembelajaran/lkpd', icon: ClipboardEdit, label: 'LKPD', color: 'bg-indigo-600' },
                                { href: '/dashboard/ai-pembelajaran/generate-soal', icon: PlusCircle, label: 'Gen Soal', color: 'bg-indigo-600' },
                             ].map(item => (
                                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-2 transition-transform active:scale-90">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wider text-slate-600">{item.label}</span>
                                </Link>
                             ))}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="space-y-2 pt-2">
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Panel Admin</p>
                            <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3.5 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-200 active:scale-95 transition-all">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><ShieldCheck className="w-5 h-5" /></div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-black text-sm tracking-tight leading-none">Buka Panel Admin Utama</span>
                                    <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-1">Manajemen Sistem</span>
                                </div>
                            </Link>
                          </div>
                        )}
                    </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t p-2 flex justify-around items-center h-16 pb-safe">
                <Link href="/dashboard" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/dashboard" ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Dasbor</span>
                </Link>
                <Link href="/dashboard/teacher-attendance" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/dashboard/teacher-attendance") ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                    <MapPin className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium text-center leading-tight">Absensi Guru</span>
                </Link>
                
                <div className="flex justify-center h-full items-center">
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

                <Link href="/dashboard/attendance" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/dashboard/attendance") ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                    <ClipboardCheck className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium text-center leading-tight">Presensi Siswa</span>
                </Link>
                <Link href="/dashboard/settings" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/dashboard/settings" ? "text-indigo-600 bg-indigo-500/10" : "text-muted-foreground")}>
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Profil</span>
                </Link>
            </div>
          </>
      )}
    </>
  );
}

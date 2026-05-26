'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
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
  ChevronRight,
  LayoutDashboard,
  UserCheck,
  Activity,
  ChevronDown,
  ChevronUp,
  Bell,
  LineChart
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
  useSidebar,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [isMonitoringExpanded, setIsMonitoringExpanded] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const NavItem = ({ href, icon: IconComponent, label, color = "" }: any) => {
    const { state } = useSidebar();
    const isActive = pathname === href || pathname.startsWith(href + '/');
    const isCollapsed = mounted ? state === "collapsed" : false;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={label}
          className={cn(
            "rounded-xl transition-all duration-300 h-11 mb-1 relative group/item",
            isActive 
              ? "bg-white text-purple-700 shadow-lg scale-[1.02]" 
              : "hover:bg-white/10 text-purple-100/70 hover:text-white",
            isCollapsed && isActive && "rounded-r-none rounded-l-2xl translate-x-1"
          )}
        >
          <Link href={href} className={cn(
              "flex items-center w-full",
              isCollapsed ? "justify-center" : "justify-start px-2"
          )}>
            <IconComponent className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300", 
                isActive ? "text-purple-600" : color,
                !isActive && "group-hover/item:scale-110",
                (!isCollapsed && mounted) && "mr-3"
            )} />
            {(!isCollapsed && mounted) && <span className="font-bold">{label}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const MobileGridItem = ({ href, iconName, label }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
        <Link 
            href={href} 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="flex flex-col items-center gap-1.5 transition-all active:scale-95 group"
        >
            <div className={cn(
                "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                "bg-[#F5F3FF] text-[#7C3AED]", // Soft Purple theme for Admin
                isActive && "shadow-xl shadow-[#7C3AED]/20 scale-110 -translate-y-1 bg-[#7C3AED] text-white"
            )}>
                <Icon icon={iconName} className="w-7 h-7" />
            </div>
            <span className={cn(
                "text-[9px] font-black text-center leading-tight uppercase tracking-[0.05em] line-clamp-2 px-1 transition-colors",
                isActive ? "text-[#7C3AED]" : "text-slate-500"
            )}>
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
            className="hidden md:flex absolute -right-3 top-20 bg-purple-700 text-white border-2 border-purple-800 shadow-xl rounded-full z-50 h-6 w-6 hover:bg-purple-600 transition-colors"
        >
            {!isCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
    )
  }

  return (
    <>
       <Sidebar 
          collapsible="icon" 
          className="hidden md:flex h-screen border-r border-purple-900/50 overflow-visible bg-purple-800"
       >
          <SidebarHeader className="p-0 shrink-0 overflow-hidden bg-purple-700">
              <div className="p-6 text-white text-center space-y-4 group-data-[collapsible=icon]:p-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-white/20 shadow-xl group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:rounded-lg overflow-hidden p-1">
                      <Image 
                        src="/icons-512x512.png" 
                        alt="Logo" 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-contain"
                      />
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-top-1 duration-300">
                      <h2 className="font-black text-lg tracking-tight">Panel Admin</h2>
                      <Badge variant="outline" className="bg-white/5 text-purple-100 border-white/10 text-[9px] uppercase tracking-widest mt-1">Superuser Mode</Badge>
                  </div>
              </div>
          </SidebarHeader>
          
          <SidebarToggle />

          <SidebarContent className="px-3 bg-purple-800">
            <ScrollArea className="flex-1">
                <SidebarGroup className="p-2 pt-4">
                    <SidebarMenu className="mb-6">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl shadow-lg group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                                <Link href="/dashboard">
                                    <ChevronLeft className="w-5 h-5 shrink-0" />
                                    <span className="font-black group-data-[collapsible=icon]:hidden ml-2">Balik ke Guru</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-300 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Monitoring Kepala</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/monitoring" icon={LayoutDashboard} label="Statistik" color="text-purple-300" />
                      <NavItem href="/monitoring/weekly-chart" icon={LineChart} label="Grafik Mingguan" color="text-purple-300" />
                      <NavItem href="/monitoring/teacher-attendance" icon={UserCheck} label="Absensi Guru" color="text-purple-300" />
                      <NavItem href="/monitoring/teacher-activity" icon={Activity} label="Aktivitas" color="text-purple-300" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-300 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Manajemen Staf</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/users" icon={Users} label="Staf & Approval" color="text-purple-300" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-300 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Data Master Rombel</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/roster/school-year" icon={CalendarCheck} label="Tahun Ajaran" color="text-purple-300" />
                      <NavItem href="/admin/roster/classes" icon={School} label="Data Kelas" color="text-purple-300" />
                      <NavItem href="/admin/roster/subjects" icon={BookOpen} label="Data Mapel" color="text-purple-300" />
                      <NavItem href="/admin/roster/students" icon={Users2} label="Data Siswa" color="text-purple-300" />
                      <NavItem href="/admin/roster/promotion" icon={ArrowRightLeft} label="Promosi Siswa" color="text-purple-300" />
                      <NavItem href="/admin/roster/alumni" icon={GraduationCap} label="Arsip Alumni" color="text-purple-300" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-300 font-black text-[9px] tracking-[0.2em] uppercase mb-3 px-3 group-data-[collapsible=icon]:hidden opacity-70">Pengaturan Sistem</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/settings/school" icon={Building} label="Data Sekolah" color="text-purple-300" />
                      <NavItem href="/admin/settings/location" icon={MapPin} label="Setelan Lokasi" color="text-purple-300" />
                      <NavItem href="/admin/settings/whatsapp" icon={MessageSquare} label="WhatsApp API" color="text-purple-300" />
                      <NavItem href="/admin/settings/schedule" icon={CalendarClock} label="Master Jadwal" color="text-purple-300" />
                      <NavItem href="/admin/settings/holidays" icon={CalendarOff} label="Hari Libur" color="text-purple-300" />
                    </SidebarMenu>
                </SidebarGroup>
            </ScrollArea>
          </SidebarContent>

          <SidebarFooter className="p-4 pt-0 shrink-0 bg-purple-900/50 border-t border-white/5">
                <div className="flex items-center gap-3 px-2 py-4 mb-2 group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-8 w-8 border border-white/10 shadow-sm shrink-0">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-purple-600 text-white font-bold text-[10px]">{profile?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="text-[11px] font-black text-white truncate">{profile?.full_name?.split(',')[0]}</p>
                        <p className="text-[8px] font-bold text-purple-300/60 uppercase tracking-widest">Administrator</p>
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

      <SidebarInset className="bg-[#fcfaff] overflow-visible">
        <header className="sticky top-0 z-40 w-full bg-purple-700 text-white shadow-md border-b border-purple-800">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-3">
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase opacity-70 tracking-widest">Administrator</span>
                        <h1 className="text-sm font-bold tracking-tight">Panel Monitoring & Roster</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white hover:bg-rose-500 hover:text-white transition-all rounded-full">
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
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
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
                            <Avatar className="h-14 w-14 border-2 border-purple-100 shadow-md">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-purple-600 text-white font-bold">{profile?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight truncate">{profile?.full_name}</h3>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.2em]">Master Admin Mode</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitoring Kepala</p>
                                <button onClick={() => setIsMonitoringExpanded(!isMonitoringExpanded)} className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-1">
                                    {isMonitoringExpanded ? 'Sembunyikan' : 'Tampilkan'}
                                    {isMonitoringExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            </div>
                            {isMonitoringExpanded && (
                                <div className="grid grid-cols-4 gap-y-6 gap-x-2 animate-in fade-in duration-300">
                                    <MobileGridItem href="/monitoring" iconName="solar:monitor-bold-duotone" label="Statistik" />
                                    <MobileGridItem href="/monitoring/weekly-chart" iconName="solar:graph-bold-duotone" label="Grafik Tren" />
                                    <MobileGridItem href="/monitoring/teacher-attendance" iconName="solar:user-check-bold-duotone" label="Absensi" />
                                    <MobileGridItem href="/monitoring/teacher-activity" iconName="solar:activity-bold-duotone" label="Aktivitas" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Manajemen Staf</p>
                                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                    <MobileGridItem href="/admin/users" iconName="solar:users-group-rounded-bold-duotone" label="Approval" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Data Master Rombel</p>
                                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                    <MobileGridItem href="/admin/roster/school-year" iconName="solar:calendar-bold-duotone" label="Tahun Ajaran" />
                                    <MobileGridItem href="/admin/roster/classes" iconName="solar:school-bold-duotone" label="Kelas" />
                                    <MobileGridItem href="/admin/roster/subjects" iconName="solar:book-2-bold-duotone" label="Mapel" />
                                    <MobileGridItem href="/admin/roster/students" iconName="solar:user-rounded-bold-duotone" label="Siswa" />
                                    <MobileGridItem href="/admin/roster/promotion" iconName="solar:transfer-horizontal-bold-duotone" label="Promosi" />
                                    <MobileGridItem href="/admin/roster/alumni" iconName="solar:graduation-cap-bold-duotone" label="Alumni" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] px-1">Pengaturan Sistem</p>
                                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                    <MobileGridItem href="/admin/settings/school" iconName="solar:city-bold-duotone" label="Sekolah" />
                                    <MobileGridItem href="/admin/settings/location" iconName="solar:map-point-bold-duotone" label="Lokasi" />
                                    <MobileGridItem href="/admin/settings/whatsapp" iconName="solar:chat-round-dots-bold-duotone" label="WhatsApp" />
                                    <MobileGridItem href="/admin/settings/schedule" iconName="solar:clock-circle-bold-duotone" label="Jadwal" />
                                    <MobileGridItem href="/admin/settings/holidays" iconName="solar:calendar-mark-bold-duotone" label="Libur" />
                                </div>
                            </div>
                        </div>

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

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white/80 backdrop-blur-xl border-t flex items-center h-16 pb-safe">
                <div className="flex-1 flex justify-center">
                    <Link href="/admin/users" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/users") ? "text-purple-600 bg-purple-50" : "text-muted-foreground")}>
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Staf</span>
                    </Link>
                </div>
                <div className="flex-1 flex justify-center items-center">
                    <button 
                      onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                      className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 text-white shadow-lg border-4 border-background transition-all active:scale-95"
                    >
                        <svg className="pointer-events-none" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12L20 12" className={cn("origin-center transition-all duration-300", isMobileMenuOpen ? "rotate-[315deg] translate-y-0" : "-translate-y-[7px]")} />
                          <path d="M4 12H20" className={cn("origin-center transition-all duration-300", isMobileMenuOpen ? "rotate-45" : "")} />
                          <path d="M4 12H20" className={cn("origin-center transition-all duration-300", isMobileMenuOpen ? "rotate-[135deg] translate-y-0" : "translate-y-[7px]")} />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 flex justify-center">
                    <Link href="/admin/settings/school" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/settings") ? "text-purple-600 bg-purple-50" : "text-muted-foreground")}>
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] mt-1 font-medium">Sistem</span>
                    </Link>
                </div>
            </div>
          </>
      )}
    </>
  );
}

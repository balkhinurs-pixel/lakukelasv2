'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Users,
  User as UserIcon,
  Users2,
  CalendarCheck,
  School,
  BookOpen,
  ArrowRightLeft,
  GraduationCap,
  MapPin,
  CalendarClock,
  Bell,
  Building,
  CalendarOff,
  Home,
  ChevronLeft,
  ShieldCheck,
  Settings,
  MessageSquare,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor Admin' },
  { href: '/admin/users', icon: Users, label: 'Kelola Staf' },
];

const rosterNavItems = [
    { href: '/admin/roster/school-year', icon: CalendarCheck, label: 'Tahun Ajaran' },
    { href: '/admin/roster/classes', icon: School, label: 'Pengaturan Kelas' },
    { href: '/admin/roster/subjects', icon: BookOpen, label: 'Pengaturan Mapel' },
    { href: '/admin/roster/students', icon: Users2, label: 'Daftar Siswa' },
    { href: '/admin/roster/promotion', icon: ArrowRightLeft, label: 'Promosi & Mutasi' },
    { href: '/admin/roster/alumni', icon: GraduationCap, label: 'Alumni' },
];

const settingsNavItems = [
    { href: '/admin/settings/school', icon: Building, label: 'Data Sekolah' },
    { href: '/admin/settings/location', icon: MapPin, label: 'Pengaturan Absensi' },
    { href: '/admin/settings/whatsapp', icon: MessageSquare, label: 'Pengaturan WhatsApp' },
    { href: '/admin/settings/schedule', icon: CalendarClock, label: 'Kelola Jadwal Guru' },
    { href: '/admin/settings/holidays', icon: CalendarOff, label: 'Hari Libur' },
]

export default function AdminLayoutClient({ 
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
        className="rounded-t-[32px] border-t-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden max-h-[90vh] z-[90]"
      >
        <div className="mx-auto w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full my-4" />
        <SheetHeader className="px-6 pb-4">
          <div className="flex items-center gap-4 text-left">
            <Avatar className="h-12 w-12 border-2 border-purple-200">
              <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} />
              <AvatarFallback>{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold truncate">{profile?.full_name || 'Admin'}</SheetTitle>
              <SheetDescription className="text-xs truncate">🛡️ Administrator • {user?.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-full max-h-[calc(90vh-120px)] px-6 pb-24">
          <div className="space-y-8 pb-12">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest pl-2">Sistem</p>
              <div className="grid grid-cols-1 gap-2">
                {adminNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl transition-all",
                      pathname === item.href ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25" : "bg-slate-100/50 dark:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest pl-2">Data Akademik</p>
              <div className="grid grid-cols-2 gap-2">
                {rosterNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl transition-all",
                      pathname.startsWith(item.href) ? "bg-purple-100 text-purple-700 font-bold border border-purple-200" : "bg-slate-100/50 dark:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest pl-2">Pengaturan</p>
              <div className="grid grid-cols-1 gap-2">
                {settingsNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl transition-all",
                      pathname.startsWith(item.href) ? "bg-purple-100 text-purple-700 font-bold border border-purple-200" : "bg-slate-100/50 dark:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
               <Link 
                  href="/monitoring" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Buka Monitoring</span>
                </Link>
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Kembali ke Mode Guru</span>
                </Link>
                <Button 
                  variant="ghost" 
                  className="justify-start h-14 rounded-2xl text-red-600 font-bold"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Keluar
                </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <Sidebar collapsible="icon" className="hidden md:flex">
        <SidebarHeader className="p-0 text-background">
          <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-600 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
              
              <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="User" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-center relative z-10">
                <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'Admin'}</p>
                <div className="mt-2">
                  <div className="text-xs font-semibold px-3 py-1 rounded-lg border backdrop-blur-sm bg-red-500/20 text-red-100 border-red-300/30">
                    🛡️ Administrator
                  </div>
                </div>
              </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 bg-gradient-to-b from-background to-background/95">
          <ScrollArea className="h-full">
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                Manajemen Sistem
              </SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} className={cn("rounded-xl mx-2", pathname === item.href && "bg-primary/15 text-primary")}>
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4 mr-2" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarSeparator className="mx-4" />
            
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4">
                Manajemen Data
              </SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {rosterNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} className={cn("rounded-xl mx-2", pathname.startsWith(item.href) && "bg-primary/15 text-primary")}>
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4 mr-2" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator className="mx-4" />
            
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4">
                Pengaturan
              </SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {settingsNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} className={cn("rounded-xl mx-2", pathname.startsWith(item.href) && "bg-primary/15 text-primary")}>
                      <Link href={item.href}>
                        <item.icon className="w-4 h-4 mr-2" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link href="/monitoring" className="flex items-center gap-3 w-full text-teal-600 font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Panel Monitoring</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link href="/dashboard" className="flex items-center gap-3 w-full text-blue-600 font-bold">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Mode Dasbor Guru</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
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
        <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-2">
                     <SidebarTrigger className="hidden md:flex text-white hover:bg-white/20" />
                     <h1 className="text-lg font-bold tracking-tight">Panel Admin</h1>
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
                <Link href="/admin" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/admin" ? "text-purple-600 bg-purple-500/10" : "text-muted-foreground")}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Dasbor</span>
                </Link>
                <Link href="/admin/users" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/admin/users" ? "text-purple-600 bg-purple-500/10" : "text-muted-foreground")}>
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Staf</span>
                </Link>
                
                <button 
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)} 
                  className="group flex flex-col items-center justify-center -mt-10 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg border-4 border-background transition-all active:scale-95"
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

                <Link href="/admin/roster/students" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/roster") ? "text-purple-600 bg-purple-500/10" : "text-muted-foreground")}>
                    <Users2 className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Siswa</span>
                </Link>
                <Link href="/admin/settings/school" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/settings") ? "text-purple-600 bg-purple-500/10" : "text-muted-foreground")}>
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">Setelan</span>
                </Link>
            </div>
          </>
      )}
    </>
  );
}

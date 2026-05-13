'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Users,
  Menu,
  User as UserIcon,
  Users2,
  CalendarCheck,
  School,
  BookOpen,
  ArrowRightLeft,
  GraduationCap,
  MapPin,
  UserCheck as UserCheckIcon,
  CalendarClock,
  Bell,
  Building,
  CalendarOff,
  Activity,
  Home,
  ChevronLeft,
  Zap,
  MessageSquare,
  ShieldCheck,
  Settings,
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
  SidebarSeparator,
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
  const { toggleSidebar, openMobile } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const NavContent = ({ items }: { items: typeof adminNavItems | typeof rosterNavItems | typeof settingsNavItems }) => (
     <SidebarMenu className="gap-2">
        {items.map((item, index) => {
          const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin';
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={{ children: item.label }}
                className={cn(
                  "rounded-xl mx-2 transition-all duration-300",
                  isActive && "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                )}
              >
                <Link href={item.href} onClick={() => {if (isMobile) toggleSidebar()}}>
                  <item.icon className={cn("w-4 h-4 mr-2", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
  );

  const AppHeader = () => (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden text-white hover:bg-white/20 hover:text-white" />
                 <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-white">Panel</span>
                    <span className="text-red-300 ml-1">Admin</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden sm:flex text-white hover:bg-white/20">
                    <Link href="/monitoring">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Panel Monitoring
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                    <Bell className="h-5 w-5" />
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Admin'} data-ai-hint="admin portrait"/>
                                <AvatarFallback className="text-foreground text-xs">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                             </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard">
                                <Home className="mr-2 h-4 w-4"/>
                                Ke Dasbor Guru
                           </Link>
                        </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                           <Link href="/monitoring">
                                <ShieldCheck className="mr-2 h-4 w-4"/>
                                Ke Panel Monitoring
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4"/>
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </header>
  );

  return (
    <>
      <Sidebar collapsible="icon">
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
              <NavContent items={adminNavItems} />
            </SidebarGroup>
            
            <SidebarSeparator className="mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />
            
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                Manajemen Data
              </SidebarGroupLabel>
              <NavContent items={rosterNavItems} />
            </SidebarGroup>

            <SidebarSeparator className="mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />
            
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                Pengaturan
              </SidebarGroupLabel>
              <NavContent items={settingsNavItems} />
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Buka Monitoring" }}>
                        <Link href="/monitoring" className="flex items-center gap-3 w-full text-teal-600 font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="group-data-[collapsible=icon]:hidden">Panel Monitoring</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Mode Guru" }}>
                        <Link href="/dashboard" className="flex items-center gap-3 w-full text-blue-600 font-bold">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="group-data-[collapsible=icon]:hidden">Mode Dasbor Guru</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarSeparator className="my-2" />
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleLogout}
                        className="hover:bg-red-50 hover:text-red-600 rounded-xl"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Keluar</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className={isMobile ? "pb-20" : ""}>
        <AppHeader />
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>

      {isMobile && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t p-2 flex justify-around items-center">
              <Link href="/admin" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/admin" ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Dasbor</span>
              </Link>
              <Link href="/admin/users" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname === "/admin/users" ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Staf</span>
              </Link>
              
              <button 
                onClick={() => toggleSidebar()} 
                className="group flex flex-col items-center justify-center -mt-8 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg border-4 border-background transition-all active:scale-95"
                aria-expanded={openMobile}
                aria-label={openMobile ? "Tutup menu" : "Buka menu"}
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
                    <path
                      d="M4 12L20 12"
                      className="origin-center -translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center translate-y-[7px] transition-all duration-300 [transition-timing-function:cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                    />
                  </svg>
              </button>

              <Link href="/admin/roster/students" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/roster") ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                  <Users2 className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Siswa</span>
              </Link>
              <Link href="/admin/settings/school" className={cn("flex flex-col items-center p-2 rounded-xl transition-all", pathname.startsWith("/admin/settings") ? "text-primary bg-primary/10" : "text-muted-foreground")}>
                  <Settings className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-medium">Setelan</span>
              </Link>
          </div>
      )}
    </>
  );
}

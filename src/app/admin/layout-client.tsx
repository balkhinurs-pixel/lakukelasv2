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
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/admin/users', icon: Users, label: 'Daftar Guru' },
  { href: '/admin/teacher-attendance', icon: UserCheckIcon, label: 'Kehadiran' },
  { href: '/admin/teacher-activity', icon: Activity, label: 'Aktivitas' },
];

const monitoringMobileNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Monitoring' },
  { href: '/admin/teacher-attendance', icon: UserCheckIcon, label: 'Kehadiran' },
  { href: '/admin/teacher-activity', icon: Activity, label: 'Aktivitas' },
  { href: '/dashboard', icon: ChevronLeft, label: 'Mode Guru' },
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
  const { toggleSidebar } = useSidebar();

  const isAdmin = profile?.role === 'admin';
  const isHeadmaster = profile?.role === 'headmaster';

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
          if (isHeadmaster && item.href === '/admin/users') return null;

          const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin';
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={{ children: item.label }}
                className={cn(
                  "group-data-[collapsible=icon]:justify-center relative transition-all duration-300 ease-out rounded-xl mx-2",
                  "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-lg hover:shadow-primary/10",
                  "hover:scale-[1.02] hover:-translate-y-0.5",
                  isActive && "bg-gradient-to-r from-primary/15 to-primary/10 shadow-lg shadow-primary/20 border border-primary/20",
                  isActive && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-primary before:rounded-r-full",
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <Link href={item.href} onClick={() => {if (isMobile) toggleSidebar()}} className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "relative transition-all duration-300",
                    isActive && "text-primary scale-110"
                  )}>
                    <item.icon className={cn(
                      "transition-all duration-300",
                      isActive ? "w-5 h-5 drop-shadow-sm" : "w-4 h-4"
                    )} />
                  </div>
                  <span className={cn(
                    "group-data-[collapsible=icon]:hidden transition-all duration-300 font-medium",
                    isActive ? "text-primary font-semibold tracking-wide" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
  );

  const BottomNavbar = () => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <div className="relative bg-background/80 backdrop-blur-xl border-t border-white/20 rounded-t-3xl shadow-2xl shadow-black/20 p-2 pb-safe">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 rounded-t-3xl" />
                <div className="relative flex justify-around items-center">
                    {monitoringMobileNavItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl w-16 h-16 transition-all duration-500 ease-out transform group overflow-hidden",
                                    "hover:scale-110 active:scale-95",
                                    isActive 
                                        ? "text-red-600 shadow-lg shadow-red-500/25 bg-red-500/10 backdrop-blur-sm -translate-y-2" 
                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                )}
                            >
                                {isActive && <div className="absolute inset-0 bg-red-500/10 rounded-2xl animate-pulse" />}
                                <div className={cn("relative z-10 transition-all duration-300", isActive && "animate-bounce")}>
                                    <item.icon className={cn("transition-all duration-300", isActive ? "w-6 h-6" : "w-5 h-5")} />
                                </div>
                                <span className={cn("text-[10px] font-medium transition-all duration-300 relative z-10", isActive ? "opacity-100 font-semibold" : "opacity-70")}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                    <button 
                        onClick={() => toggleSidebar()}
                        className="relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl w-16 h-16 text-muted-foreground"
                    >
                        <div className="relative z-10 transition-transform duration-300 group-hover:rotate-180">
                            <Menu className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium opacity-70">Lainnya</span>
                    </button>
                </div>
            </div>
        </div>
    )
  };

  const AppHeader = () => (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden text-white hover:bg-white/20 hover:text-white" />
                 <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-white">Panel</span>
                    <span className="text-red-300">{isHeadmaster ? 'Monitoring' : 'Admin'}</span>
                </h1>
            </div>
            <div className="flex items-center gap-2">
                {isHeadmaster && (
                  <Button variant="ghost" asChild className="hidden sm:flex text-white hover:bg-white/20">
                    <Link href="/dashboard">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Mode Guru
                    </Link>
                  </Button>
                )}
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
                                Kembali ke Dasbor Guru
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
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
          <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 via-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
              
              <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="User" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-center relative z-10">
                <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'User'}</p>
                <p className="text-sm text-white/80 drop-shadow-sm">{user?.email}</p>
                <div className="mt-2">
                  <div className={cn(
                      "text-xs font-semibold px-3 py-1 rounded-lg border backdrop-blur-sm",
                      isAdmin ? "bg-red-500/20 text-red-100 border-red-300/30" : "bg-teal-500/20 text-teal-100 border-teal-300/30"
                  )}>
                    {isAdmin ? '🛡️ Administrator' : '🎓 Kepala Sekolah'}
                  </div>
                </div>
              </div>
          </div>
          <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex group-data-[state=expanded]:hidden">
              <Avatar className="h-12 w-12 border-2 border-primary shadow-lg transition-transform duration-300 hover:scale-105">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="User" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 bg-gradient-to-b from-background to-background/95">
          <ScrollArea className="h-full">
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Monitoring Panel
              </SidebarGroupLabel>
              <NavContent items={adminNavItems} />
            </SidebarGroup>
            
            {isAdmin && (
                <>
                    <SidebarSeparator className="mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />
                    
                    <SidebarGroup className="p-4">
                    <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                        <Users2 className="w-4 h-4 mr-2" />
                        Manajemen Data
                    </SidebarGroupLabel>
                    <NavContent items={rosterNavItems} />
                    </SidebarGroup>

                    <SidebarSeparator className="mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />
                    
                    <SidebarGroup className="p-4">
                    <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                        <Users2 className="w-4 h-4 mr-2" />
                        Pengaturan
                    </SidebarGroupLabel>
                    <NavContent items={settingsNavItems} />
                    </SidebarGroup>
                </>
            )}
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={{ children: "Kembali ke Guru" }}>
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
                        tooltip={{ children: "Keluar" }}
                        className={cn(
                          "group-data-[collapsible=icon]:justify-center relative transition-all duration-300 ease-out rounded-xl mx-2",
                          "hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 hover:shadow-lg hover:shadow-red-500/10 hover:text-red-500",
                        )}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <LogOut className="w-4 h-4" />
                            <span className="group-data-[collapsible=icon]:hidden font-medium text-muted-foreground">
                              Keluar
                            </span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <AppHeader />
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>

      {isHeadmaster && isMobile && <BottomNavbar />}
    </>
  );
}

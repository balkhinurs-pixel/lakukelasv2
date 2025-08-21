

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
  Users,
  ChevronDown,
  Menu,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  Home,
  Bell,
  GraduationCap,
  CalendarCheck,
  School,
  BookOpen,
  Users2,
  ArrowRightLeft,
  Zap,
  ScanLine,
  Award,
  PenTool,
  Grid3X3,
  MapPin,
  Contact
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
  useSidebar,
  SidebarTrigger,
  SidebarSeparator,
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dasbor' },
  { href: '/dashboard/teacher-attendance', icon: MapPin, label: 'Absensi Guru' },
  { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
];

const homeroomNavItems = [
    { href: '/dashboard/homeroom/students', icon: Users2, label: 'Data Siswa Kelas' },
    { href: '/dashboard/homeroom/reports', icon: BarChart3, label: 'Laporan Kelas' },
];

const mainMobileNavItems = [
    { href: '/dashboard', icon: Zap, label: 'Dasbor' },
    { href: '/dashboard/attendance', icon: ScanLine, label: 'Presensi' },
    { href: '/dashboard/grades', icon: Award, label: 'Nilai' },
    { href: '/dashboard/journal', icon: PenTool, label: 'Jurnal' },
];

const mobileSidebarNavItems = navItems.filter(
    (item) => !mainMobileNavItems.some((mobileItem) => mobileItem.href === item.href)
);

export default function DashboardLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'account_status' | 'is_homeroom_teacher'> | null
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();
  const isPro = true; // All users are now Pro

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const ProfileHeader = () => (
    <SidebarHeader className="p-0 text-background">
      <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 via-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
          {/* Background pattern overlay */}
          <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          
          {/* Animated floating elements */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
          <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/30 rounded-full animate-ping" style={{animationDelay: '1s'}} />
          
          <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
            <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} data-ai-hint="teacher portrait" />
            <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
          <div className="text-center relative z-10">
            <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'Guru'}</p>
            <p className="text-sm text-white/80 drop-shadow-sm">{user?.email}</p>
            <div className="mt-2">
              <Badge variant={'outline'} className="text-xs font-semibold backdrop-blur-sm border-white/30 bg-green-500/20 text-green-100 border-green-300/30 shadow-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                Akun Pro
              </Badge>
            </div>
          </div>
      </div>
      <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex group-data-[state=expanded]:hidden">
          <Avatar className="h-12 w-12 border-2 border-primary shadow-lg transition-transform duration-300 hover:scale-105">
              <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} data-ai-hint="teacher portrait" />
              <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
      </div>
    </SidebarHeader>
  );

  const MainNavContent = ({ items }: { items: (typeof navItems | typeof homeroomNavItems) }) => (
    <SidebarMenu className="gap-2">
      {items.map((item, index) => {
        const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard';
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
                "after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-r after:from-transparent after:via-white/[0.02] after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300"
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
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  "group-data-[collapsible=icon]:hidden transition-all duration-300 font-medium",
                  isActive ? "text-primary font-semibold tracking-wide" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  );

    const BottomNavbar = () => {
        const [rippleEffect, setRippleEffect] = React.useState<{x: number, y: number, show: boolean}>({
            x: 0,
            y: 0,
            show: false
        });

        const handleRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            setRippleEffect({ x, y, show: true });
            setTimeout(() => setRippleEffect(prev => ({ ...prev, show: false })), 600);
        };

        return (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                {/* Modern glassmorphism container */}
                <div className="relative bg-background/80 backdrop-blur-xl border-t border-white/20 rounded-t-3xl shadow-2xl shadow-black/20 p-2 pb-safe">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 rounded-t-3xl" />
                    
                    {/* Navigation items container */}
                    <div className="relative flex justify-around items-center">
                        {mainMobileNavItems.map((item, index) => {
                            // More specific path matching for active state
                            const isActive = (item.href === '/dashboard') 
                                ? pathname === item.href 
                                : pathname.startsWith(item.href);

                            return (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    onClick={handleRippleEffect}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl w-16 h-16 transition-all duration-500 ease-out transform group overflow-hidden",
                                        "hover:scale-110 active:scale-95",
                                        isActive 
                                            ? "text-primary shadow-lg shadow-primary/25 bg-primary/10 backdrop-blur-sm -translate-y-2" 
                                            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                    )}
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    {/* Ripple effect */}
                                    {rippleEffect.show && (
                                        <span 
                                            className="absolute inset-0 bg-primary/20 rounded-full animate-ping"
                                            style={{
                                                left: rippleEffect.x - 10,
                                                top: rippleEffect.y - 10,
                                                width: '20px',
                                                height: '20px'
                                            }}
                                        />
                                    )}
                                    
                                    {/* Active glow effect */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse" />
                                    )}
                                    
                                    {/* Icon with animation */}
                                    <div className={cn(
                                        "relative z-10 transition-all duration-300",
                                        isActive && "animate-bounce"
                                    )}>
                                        <item.icon className={cn(
                                            "transition-all duration-300",
                                            isActive ? "w-6 h-6" : "w-5 h-5"
                                        )} />
                                    </div>
                                    
                                    {/* Label with fade animation */}
                                    <span className={cn(
                                        "text-xs font-medium transition-all duration-300 relative z-10",
                                        isActive ? "opacity-100 font-semibold" : "opacity-70 group-hover:opacity-100"
                                    )}>
                                        {item.label}
                                    </span>

                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                                    )}
                                </Link>
                            )
                        })}
                        
                        {/* Menu button with enhanced styling */}
                        <button 
                            onClick={(e) => {
                                handleRippleEffect(e);
                                toggleSidebar();
                            }}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 p-3 rounded-2xl w-16 h-16",
                                "text-muted-foreground hover:text-foreground transition-all duration-500 ease-out transform group overflow-hidden",
                                "hover:scale-110 active:scale-95 hover:bg-foreground/5"
                            )}
                        >
                            {/* Ripple effect for menu button */}
                            {rippleEffect.show && (
                                <span 
                                    className="absolute inset-0 bg-foreground/10 rounded-full animate-ping"
                                    style={{
                                        left: rippleEffect.x - 10,
                                        top: rippleEffect.y - 10,
                                        width: '20px',
                                        height: '20px'
                                    }}
                                />
                            )}
                            
                            <div className="relative z-10 transition-transform duration-300 group-hover:rotate-180">
                                <Menu className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium transition-all duration-300 relative z-10 opacity-70 group-hover:opacity-100">
                                Lainnya
                            </span>
                        </button>
                    </div>
                </div>

                {/* Floating animation keyframes */}
                <style jsx>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-6px); }
                    }
                    .animate-float {
                        animation: float 3s ease-in-out infinite;
                    }
                `}</style>
            </div>
        )
    };
  
  const AppHeader = () => (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md">
        <div className="flex items-center justify-between h-16 px-4">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden text-white hover:bg-white/20 hover:text-white" />
                 <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-white">Laku</span>
                    <span className="text-green-300">Kelas</span>
                </h1>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                    <Bell className="h-5 w-5" />
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={(profile?.avatar_url || "https://placehold.co/32x32.png")} alt={profile?.full_name || 'Guru'} data-ai-hint="teacher portrait"/>
                                <AvatarFallback className="text-foreground text-xs">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
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
                           <Link href="/dashboard/settings" onClick={() => {if (isMobile) toggleSidebar()}}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                Profil Saya
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

  const MobileSidebar = () => (
    <>
      <ProfileHeader />
      <SidebarContent className="p-0 bg-gradient-to-b from-background to-background/95">
        <ScrollArea className="flex-1">
            {profile?.is_homeroom_teacher && (
                <SidebarGroup className="p-4">
                    <SidebarGroupLabel className="text-orange-600 font-semibold text-sm tracking-wider uppercase bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20 mb-4">
                      <Contact className="w-4 h-4 mr-2 inline" />
                      Menu Wali Kelas
                    </SidebarGroupLabel>
                    <MainNavContent items={homeroomNavItems} />
                </SidebarGroup>
            )}
            <SidebarGroup className="p-4">
                <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4">
                  <Grid3X3 className="w-4 h-4 mr-2 inline" />
                  Menu Lainnya
                </SidebarGroupLabel>
                <MainNavContent items={mobileSidebarNavItems} />
            </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </>
  );

  const DesktopSidebar = () => (
    <>
      <ProfileHeader />
      <SidebarContent className="p-0">
        <ScrollArea className="flex-1">
            <SidebarGroup className="p-4">
                <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4">
                    Menu Utama
                </SidebarGroupLabel>
                <MainNavContent items={navItems} />
            </SidebarGroup>
             {profile?.is_homeroom_teacher && (
                <>
                    <SidebarSeparator className="mx-4 bg-gradient-to-r from-transparent via-border to-transparent" />
                    <SidebarGroup className="p-4">
                        <SidebarGroupLabel className="text-orange-600 font-semibold text-sm tracking-wider uppercase bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20 mb-4">
                            <Contact className="w-4 h-4 mr-2 inline" />
                            Wali Kelas
                        </SidebarGroupLabel>
                        <MainNavContent items={homeroomNavItems} />
                    </SidebarGroup>
                </>
            )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
          <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton
                      asChild
                      tooltip={{ children: "Pengaturan" }}
                      className="group-data-[collapsible=icon]:justify-center"
                  >
                      <Link href="/dashboard/settings">
                          <Settings />
                          <span className="group-data-[collapsible=icon]:hidden">Pengaturan</span>
                      </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </>
  );

  return (
    <>
       <Sidebar>
          { isMobile ? <MobileSidebar /> : <DesktopSidebar /> }
       </Sidebar>

      <SidebarInset>
        <AppHeader />
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
      {isMobile && <BottomNavbar />}
    </>
  );
}

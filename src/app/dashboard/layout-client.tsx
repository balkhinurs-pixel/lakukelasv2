
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
  KeyRound,
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
  ArrowRightLeft
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
import { useActivation } from '@/hooks/use-activation.tsx';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dasbor' },
  { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
  { href: '/dashboard/activation', icon: KeyRound, label: 'Aktivasi' },
];

const mainMobileNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dasbor' },
    { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
    { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai' },
    { href: '/dashboard/journal', icon: BookText, label: 'Jurnal' },
];

const mobileSidebarNavItems = navItems.filter(
    (item) => !mainMobileNavItems.some((mobileItem) => mobileItem.href === item.href)
);

const rosterNavItems = [
    { href: '/dashboard/roster/school-year', icon: CalendarCheck, label: 'Tahun Ajaran' },
    { href: '/dashboard/roster/classes', icon: School, label: 'Pengaturan Kelas' },
    { href: '/dashboard/roster/subjects', icon: BookOpen, label: 'Pengaturan Mapel' },
    { href: '/dashboard/roster/students', icon: Users2, label: 'Daftar Siswa' },
    { href: '/dashboard/roster/promotion', icon: ArrowRightLeft, label: 'Promosi & Mutasi' },
];


export default function DashboardLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'account_status'> | null
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isPro, setActivationStatus } = useActivation();
  const isMobile = useIsMobile();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  React.useEffect(() => {
    if (profile?.account_status) {
        setActivationStatus(profile.account_status === 'Pro');
    }
  }, [profile, setActivationStatus]);

  const StatusBadge = () => (
    <Badge variant={'outline'} className={cn("mt-2 text-xs font-semibold", 
      isPro 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200'
    )}>
      {isPro ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
      Akun {isPro ? "Pro" : "Gratis"}
    </Badge>
  );

  const ProfileHeader = () => (
    <SidebarHeader className="p-0 text-background">
      <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden">
          <Avatar className="h-20 w-20 border-4 border-white/50">
            <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} data-ai-hint="teacher portrait" />
            <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-lg font-bold">{profile?.full_name || 'Guru'}</p>
            <p className="text-sm text-primary-foreground/80">{user?.email}</p>
            <StatusBadge />
          </div>
      </div>
      <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex group-data-[state=expanded]:hidden">
          <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarImage src={(profile?.avatar_url || "https://placehold.co/100x100.png")} alt={profile?.full_name || 'Teacher'} data-ai-hint="teacher portrait" />
              <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
          </Avatar>
      </div>
    </SidebarHeader>
  );

  const MainNavContent = ({ items }: { items: typeof navItems }) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard'}
            tooltip={{ children: item.label }}
            className="group-data-[collapsible=icon]:justify-center"
          >
            <Link href={item.href} onClick={() => {if (isMobile) toggleSidebar()}}>
              <item.icon className={cn("group-data-[active=true]:text-primary")} />
              <span className="group-data-[collapsible=icon]:hidden group-data-[active=true]:text-primary group-data-[active=true]:font-semibold">
                {item.label}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  const RosterNavContent = () => (
    <SidebarMenu>
      {rosterNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
            tooltip={{ children: item.label }}
            className="group-data-[collapsible=icon]:justify-center"
          >
            <Link href={item.href} onClick={() => {if (isMobile) toggleSidebar()}}>
              <item.icon className={cn("group-data-[active=true]:text-primary")} />
              <span className="group-data-[collapsible=icon]:hidden group-data-[active=true]:text-primary group-data-[active=true]:font-semibold">
                {item.label}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  const BottomNavbar = () => {
    const navRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = React.useState({});
    const [svgPath, setSvgPath] = React.useState('');
  
    const itemColors = {
      '/dashboard': 'text-purple-500',
      '/dashboard/attendance': 'text-blue-500',
      '/dashboard/grades': 'text-green-500',
      '/dashboard/journal': 'text-orange-500',
      'default': 'text-pink-500',
    };
  
    const getActiveColor = (path: string) => {
      return itemColors[path as keyof typeof itemColors] || itemColors.default;
    };
  
    React.useEffect(() => {
      const activeItem = navRef.current?.querySelector<HTMLAnchorElement>('[data-active="true"]');
      if (activeItem && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const left = itemRect.left - navRect.left;
        const width = itemRect.width;
        
        setIndicatorStyle({
          transform: `translateX(${left}px)`,
          width: `${width}px`,
        });
  
        // SVG Path Calculation
        const notchWidth = 70; // Width of the curve
        const notchHeight = 12; // Height of the curve
        const barHeight = 64; // Total height of the navbar
        const startX = left - (notchWidth - width) / 2;
        
        const newPath = `
          M 0,${notchHeight} 
          L ${startX},${notchHeight} 
          C ${startX + 10},${notchHeight} ${startX + 10},0 ${startX + (notchWidth / 2)},0 
          S ${startX + notchWidth - 10},${notchHeight} ${startX + notchWidth},${notchHeight} 
          L ${navRect.width},${notchHeight} 
          L ${navRect.width},${barHeight} 
          L 0,${barHeight} Z
        `;
        setSvgPath(newPath);
      }
    }, [pathname]);
  
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-50">
        <div ref={navRef} className="relative h-full w-full flex justify-around items-center px-2 bg-transparent">
          <svg className="absolute bottom-0 left-0 w-full h-full" width="100%" height="100%" viewBox="0 0 375 64" preserveAspectRatio="none">
             <path d={svgPath} className="fill-card transition-all duration-300 ease-in-out" />
          </svg>

          {/* Indicator Bubble */}
          <div 
            className="absolute bottom-4 h-12 w-12 flex items-center justify-center rounded-full transition-transform duration-300 ease-in-out"
            style={{ ...indicatorStyle, bottom: '1.75rem', height: '48px', width: '48px'}}
          >
             <div className={cn("h-full w-full rounded-full", getActiveColor(pathname).replace('text-', 'bg-'))} style={{opacity: 0.15}}></div>
          </div>
  
          {mainMobileNavItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive}
                className={cn(
                  "relative z-10 flex flex-col items-center justify-center w-16 h-16 transition-all duration-300",
                  isActive ? "-mt-6" : "text-muted-foreground"
                )}
              >
                <div className={cn("flex items-center justify-center h-12 w-12 rounded-full", isActive && getActiveColor(pathname).replace('text-', 'bg-'))}>
                   <item.icon className={cn("w-6 h-6", isActive ? "text-white" : "")}/>
                </div>
                <span className={cn("text-xs mt-1 transition-opacity duration-300", isActive ? "opacity-100 font-semibold" : "opacity-0")}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={toggleSidebar} className="relative z-10 flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
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
      <SidebarContent className="p-0">
        <ScrollArea className="flex-1">
            <SidebarGroup>
                <SidebarGroupLabel>MENU LAINNYA</SidebarGroupLabel>
                <MainNavContent items={mobileSidebarNavItems} />
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>MANAJEMEN</SidebarGroupLabel>
                <RosterNavContent />
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
            <SidebarGroup>
                <SidebarGroupLabel>UTAMA</SidebarGroupLabel>
                <MainNavContent items={navItems} />
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <SidebarGroupLabel>MANAJEMEN</SidebarGroupLabel>
                <RosterNavContent />
            </SidebarGroup>
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

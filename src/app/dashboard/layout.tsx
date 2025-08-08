
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookText,
  CalendarClock,
  ClipboardCheck,
  ClipboardEdit,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  ChevronDown,
  KeyRound,
  Menu,
  PanelLeft,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  SidebarMenuSub,
  useSidebar,
  SidebarTrigger,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLogo } from '@/components/icons';
import { useActivation } from '@/hooks/use-activation';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
];

const mainMobileNavItems = navItems.slice(0, 4);
const moreMobileNavItems = [
    ...navItems.slice(4),
    { href: '/dashboard/roster/students', icon: Users, label: 'Rombel' },
    { href: '/dashboard/activation', icon: KeyRound, label: 'Aktivasi' },
    { href: '/dashboard/settings', icon: Settings, label: 'Pengaturan' },
]


const rosterNavItems = [
    { href: '/dashboard/roster/students', label: 'Daftar Siswa' },
    { href: '/dashboard/roster/classes', label: 'Pengaturan Kelas' },
    { href: '/dashboard/roster/subjects', label: 'Pengaturan Mapel' },
    { href: '/dashboard/roster/school-year', label: 'Tahun Ajaran' },
    { href: '/dashboard/roster/promotion', label: 'Promosi & Mutasi' },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const { isPro } = useActivation();
  const isMobile = useIsMobile();
  const { state: sidebarState } = useSidebar();
  const isRosterActive = pathname.startsWith('/dashboard/roster');

  const BottomNavbar = () => {
    const { toggleSidebar } = useSidebar();
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 flex justify-around items-center">
            {mainMobileNavItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 rounded-md", pathname === item.href ? "text-primary" : "text-muted-foreground")}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs">{item.label}</span>
                </Link>
            ))}
            <button onClick={toggleSidebar} className="flex flex-col items-center gap-1 p-2 rounded-md text-muted-foreground">
                <Menu className="w-5 h-5" />
                <span className="text-xs">Lainnya</span>
            </button>
        </div>
    )
  }

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AppLogo className="size-8 text-primary" />
                <span className="text-lg font-semibold font-headline group-data-[state=collapsed]:hidden">Classroom Zephyr</span>
            </div>
            <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard'}
                  tooltip={{ children: item.label }}
                  className="hidden md:flex"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {isMobile && moreMobileNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            
             <SidebarMenuItem>
                <Collapsible defaultOpen={isRosterActive}>
                    <div className={cn("flex items-center group-data-[state=collapsed]:justify-center", isRosterActive && "text-sidebar-primary-foreground font-semibold")}>
                        <SidebarMenuButton
                            asChild
                            isActive={isRosterActive}
                            className="flex-1 justify-start p-2"
                            tooltip={{ children: 'Manajemen Rombel' }}
                        >
                            <Link href="/dashboard/roster/students">
                                <Users />
                                <span className="group-data-[state=collapsed]:hidden">Manajemen Rombel</span>
                            </Link>
                        </SidebarMenuButton>

                        <CollapsibleTrigger asChild>
                             <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 shrink-0 group-data-[state=collapsed]:hidden", isRosterActive ? "text-sidebar-primary-foreground hover:text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground")}
                            >
                                <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:-rotate-180" />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {rosterNavItems.map(item => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === item.href} size="sm">
                                        <Link href={item.href}>{item.label}</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
             </SidebarMenuItem>

             <SidebarMenuItem className="hidden md:block">
              <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/dashboard/activation')}
                >
                  <Link href="/dashboard/activation">
                    <KeyRound />
                    <span>Aktivasi Akun</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>

             <SidebarMenuItem className="hidden md:block">
              <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/dashboard/settings')}
                >
                  <Link href="/dashboard/settings">
                    <Settings />
                    <span>Pengaturan</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Teacher" data-ai-hint="teacher portrait" />
                    <AvatarFallback>GT</AvatarFallback>
                  </Avatar>
                  <div className="text-left group-data-[state=collapsed]:hidden">
                    <p className="text-sm font-medium">Guru Tangguh</p>
                    <p className="text-xs text-muted-foreground">guru@sekolah.id</p>
                  </div>
                  {isPro && <Badge variant="default" className="ml-auto bg-green-600 hover:bg-green-700 group-data-[state=collapsed]:hidden">Pro</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="right" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Guru Tangguh</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      guru@sekolah.id
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard/activation">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <div>
                            <span>Aktivasi Akun</span>
                            <p className="text-xs text-muted-foreground">Status: {isPro ? 'Pro' : 'Gratis'}</p>
                        </div>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                        <User className="mr-2 h-4 w-4" />Profil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="p-4 sm:p-6 lg:p-8 flex items-center md:hidden">
             <SidebarTrigger />
             <div className="flex items-center gap-2 ml-4">
                <AppLogo className="size-8 text-primary" />
                <span className="text-lg font-semibold font-headline">Classroom Zephyr</span>
            </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 pt-0 md:pt-8">
            {children}
        </div>
      </SidebarInset>
      {isMobile && <BottomNavbar />}
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}

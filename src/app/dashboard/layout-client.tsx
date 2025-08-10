
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
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  ChevronDown,
  KeyRound,
  Menu,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
  CalendarDays
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
  SidebarMenuSub,
  useSidebar,
  SidebarTrigger,
  SidebarMenuSubButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useActivation } from '@/hooks/use-activation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/dashboard/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Nilai' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
];

const mainMobileNavItems = navItems.slice(0, 4);

const rosterNavItems = [
    { href: '/dashboard/roster/school-year', label: 'Tahun Ajaran' },
    { href: '/dashboard/roster/classes', label: 'Pengaturan Kelas' },
    { href: '/dashboard/roster/subjects', label: 'Pengaturan Mapel' },
    { href: '/dashboard/roster/students', label: 'Daftar Siswa' },
    { href: '/dashboard/roster/promotion', label: 'Promosi & Mutasi' },
];

const settingsNavItems = [
    { href: '/dashboard/settings', icon: UserIcon, label: 'Profil Saya' },
    { href: '/dashboard/activation', icon: KeyRound, label: 'Aktivasi Akun' },
]

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
  const isRosterActive = pathname.startsWith('/dashboard/roster');

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

  const SidebarNavContent = () => (
    <>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/dashboard'}
              tooltip={{ children: item.label }}
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link href={item.href}>
                <item.icon className={cn("group-data-[active=true]:text-primary")} />
                <span className="group-data-[collapsible=icon]:hidden group-data-[active=true]:text-primary group-data-[active=true]:font-semibold">
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarSeparator className="my-2" />

      <SidebarMenu>
        <SidebarMenuItem>
            <Collapsible defaultOpen={isRosterActive}>
                <div className={cn("flex items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full", isRosterActive && "text-sidebar-primary-foreground font-semibold")}>
                    <SidebarMenuButton
                        asChild
                        isActive={isRosterActive}
                        className="flex-1 justify-start p-2 group-data-[collapsible=icon]:justify-center"
                        tooltip={{ children: 'Manajemen Rombel' }}
                    >
                        <Link href="/dashboard/roster/students">
                            <Users className={cn(isRosterActive && "text-primary")} />
                            <span className={cn("group-data-[collapsible=icon]:hidden", isRosterActive && "text-primary font-semibold")}>
                              Manajemen Rombel
                            </span>
                        </Link>
                    </SidebarMenuButton>

                    <CollapsibleTrigger asChild>
                         <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 shrink-0 group-data-[collapsible=icon]:hidden", isRosterActive ? "text-primary" : "text-muted-foreground")}
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
      </SidebarMenu>
    </>
  );

  const BottomNavbar = () => {
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

  const StatusBadge = () => (
    <Badge variant={isPro ? "default" : "secondary"} className={cn("mt-2", isPro ? 'bg-green-500/20 text-green-50 border-green-400/30' : 'bg-gray-500/20 text-gray-50 border-gray-400/30')}>
      {isPro ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
      Akun {isPro ? "Pro" : "Gratis"}
    </Badge>
  );

  return (
    <>
      <Sidebar collapsible="icon">
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

        <SidebarContent className="p-2">
            <SidebarNavContent />
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SidebarSeparator className="my-2" />
           <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("group-data-[active=true]:text-primary")} />
                      <span className="group-data-[collapsible=icon]:hidden group-data-[active=true]:text-primary group-data-[active=true]:font-semibold">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip={{ children: "Keluar" }}
                    className="group-data-[collapsible=icon]:justify-center"
                  >
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="p-4 sm:p-6 lg:p-8 flex items-center md:hidden">
             <SidebarTrigger />
        </header>
        <div className="p-4 sm:p-6 lg:p-8 pt-0 md:pt-8">
            {children}
        </div>
      </SidebarInset>
      {isMobile && <BottomNavbar />}
    </>
  );
}

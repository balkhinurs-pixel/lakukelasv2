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
  SidebarTrigger,
  SidebarFooter,
  SidebarMenuSub,
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
import { cn } from '@/lib/utils';
import * as React from 'react';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Input Nilai' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal Mengajar' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
];

const rosterNavItems = [
    { href: '/dashboard/roster/students', label: 'Daftar Siswa' },
    { href: '/dashboard/roster/classes', label: 'Pengaturan Kelas' },
    { href: '/dashboard/roster/school-year', label: 'Tahun Ajaran' },
    { href: '/dashboard/roster/promotion', label: 'Promosi & Mutasi' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRosterActive = pathname.startsWith('/dashboard/roster');

  const getPageTitle = () => {
    const allNavItems = [...navItems, ...rosterNavItems, {href: '/dashboard/roster', label: 'Manajemen Rombel'}];
    // For nested routes, find the best match
    const currentItem = allNavItems.slice().reverse().find(item => pathname.startsWith(item.href));
    return currentItem?.label || 'Dasbor';
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <AppLogo className="size-8 text-primary" />
                <span className="text-lg font-semibold font-headline">Classroom Zephyr</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
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
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                        className="justify-between"
                        isActive={isRosterActive}
                        >
                            <div className="flex items-center gap-2">
                                <Users />
                                <span>Manajemen Rombel</span>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {rosterNavItems.map(item => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>{item.label}</Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
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
                  <div className="text-left">
                    <p className="text-sm font-medium">Guru Tangguh</p>
                    <p className="text-xs text-muted-foreground">guru@sekolah.id</p>
                  </div>
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
                <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profil</DropdownMenuItem>
                <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Pengaturan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><LogOut className="mr-2 h-4 w-4" />Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

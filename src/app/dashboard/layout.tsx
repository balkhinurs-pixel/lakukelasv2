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
  SidebarFooter
} from '@/components/ui/sidebar';
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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/dashboard/attendance', icon: ClipboardCheck, label: 'Presensi' },
  { href: '/dashboard/grades', icon: ClipboardEdit, label: 'Input Nilai' },
  { href: '/dashboard/journal', icon: BookText, label: 'Jurnal Mengajar' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/dashboard/schedule', icon: CalendarClock, label: 'Jadwal' },
  { href: '/dashboard/roster', icon: Users, label: 'Daftar Kelas' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getPageTitle = () => {
    // For nested routes, find the best match
    const currentItem = navItems.slice().reverse().find(item => pathname.startsWith(item.href));
    return currentItem?.label || 'Dasbor';
  }

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
                 <DropdownMenuItem asChild>
                  <Link href="/"><LogOut className="mr-2 h-4 w-4" />Keluar</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <h1 className="text-lg font-semibold font-headline">{getPageTitle()}</h1>
                </div>
            </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

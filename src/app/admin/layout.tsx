
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  CreditCard,
  TicketPercent,
  BarChart,
  ChevronDown,
  Menu
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
  useSidebar
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';


const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/admin/users', icon: Users, label: 'Pengguna' },
  { href: '/admin/analytics', icon: BarChart, label: 'Analitik' },
  { href: '/admin/pricing', icon: CreditCard, label: 'Harga' },
  { href: '/admin/coupons', icon: TicketPercent, label: 'Kupon' },
];

const BottomNavbar = () => {
    const pathname = usePathname();
    const { toggleSidebar } = useSidebar();
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 flex justify-around items-center">
            {navItems.slice(0, 4).map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 p-2 rounded-md", pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground")}>
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <AppLogo className="size-8 text-primary" />
                <span className="text-lg font-semibold font-headline">Admin Zephyr</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)}
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
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="admin portrait" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@zephyr.com</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="right" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@zephyr.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                        <User className="mr-2 h-4 w-4" />Ke Dasbor Guru
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
        <div className="p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
      {isMobile && <BottomNavbar />}
    </SidebarProvider>
  );
}

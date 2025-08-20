
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';


const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/admin/users', icon: Users, label: 'Pengguna' },
  { href: '/admin/teacher-attendance', icon: UserCheckIcon, label: 'Kehadiran Guru' },
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
    { href: '/admin/settings/location', icon: MapPin, label: 'Pengaturan Lokasi' },
    { href: '/admin/settings/schedule', icon: CalendarClock, label: 'Kelola Jadwal Guru' },
]

export default function AdminLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

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
            {adminNavItems.map((item, index) => {
              const isActive = pathname === item.href;

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
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-0 text-background">
          <div className="relative flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 via-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden overflow-hidden">
              {/* Background pattern overlay */}
              <div className="absolute inset-0 bg-white/[0.05] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
              
              {/* Animated floating elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
              <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/30 rounded-full animate-ping" style={{animationDelay: '1s'}} />
              
              <Avatar className="h-20 w-20 border-4 border-white/30 shadow-2xl shadow-black/20 transition-transform duration-300 hover:scale-105 hover:border-white/50 relative z-10">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="Admin" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground bg-white/20 backdrop-blur-sm">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div className="text-center relative z-10">
                <p className="text-lg font-bold text-white drop-shadow-sm">{profile?.full_name || 'Admin User'}</p>
                <p className="text-sm text-white/80 drop-shadow-sm">{user?.email}</p>
                <div className="mt-2">
                  <div className="text-xs font-semibold bg-red-500/20 text-red-100 border border-red-300/30 backdrop-blur-sm px-3 py-1 rounded-lg">
                    🛡️ Administrator
                  </div>
                </div>
              </div>
          </div>
          <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex group-data-[state=expanded]:hidden">
              <Avatar className="h-12 w-12 border-2 border-primary shadow-lg transition-transform duration-300 hover:scale-105">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="Admin" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0 bg-gradient-to-b from-background to-background/95">
          <ScrollArea className="h-full">
            <SidebarGroup className="p-4">
              <SidebarGroupLabel className="text-primary/80 font-semibold text-sm tracking-wider uppercase bg-primary/5 px-3 py-2 rounded-lg border border-primary/10 mb-4 flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Admin Panel
              </SidebarGroupLabel>
              <NavContent items={adminNavItems} />
            </SidebarGroup>
            
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
          </ScrollArea>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/50">
            <SidebarSeparator className="my-2 bg-gradient-to-r from-transparent via-border to-transparent" />
            <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip={{ children: "Ke Dasbor Guru" }}
                        className={cn(
                          "group-data-[collapsible=icon]:justify-center relative transition-all duration-300 ease-out rounded-xl mx-2",
                          "hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10",
                          "hover:scale-[1.02] hover:-translate-y-0.5",
                          "after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-r after:from-transparent after:via-white/[0.02] after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300"
                        )}
                    >
                        <Link href="/dashboard" onClick={() => {if (isMobile) toggleSidebar()}} className="flex items-center gap-3 w-full">
                            <div className="relative transition-all duration-300">
                              <UserIcon className="w-4 h-4 transition-all duration-300" />
                            </div>
                            <span className="group-data-[collapsible=icon]:hidden transition-all duration-300 font-medium text-muted-foreground">
                              Ke Dasbor Guru
                            </span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleLogout}
                        tooltip={{ children: "Keluar" }}
                        className={cn(
                          "group-data-[collapsible=icon]:justify-center relative transition-all duration-300 ease-out rounded-xl mx-2",
                          "hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 hover:shadow-lg hover:shadow-red-500/10 hover:text-red-500",
                          "hover:scale-[1.02] hover:-translate-y-0.5",
                          "after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-r after:from-transparent after:via-white/[0.02] after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300"
                        )}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="relative transition-all duration-300">
                              <LogOut className="w-4 h-4 transition-all duration-300" />
                            </div>
                            <span className="group-data-[collapsible=icon]:hidden transition-all duration-300 font-medium text-muted-foreground">
                              Keluar
                            </span>
                        </div>
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
  )
}

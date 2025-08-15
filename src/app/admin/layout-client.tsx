
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LayoutDashboard,
  LogOut,
  Users,
  Menu,
  KeySquare,
  User as UserIcon,
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';


const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/admin/users', icon: Users, label: 'Pengguna' },
  { href: '/admin/codes', icon: KeySquare, label: 'Kode Aktivasi' },
];

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

  const SidebarNavContent = () => (
    <>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin'}
              tooltip={{ children: item.label }}
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link href={item.href} onClick={() => {if (isMobile) toggleSidebar()}}>
                <item.icon className="group-data-[active=true]:text-primary" />
                <span className="group-data-[collapsible=icon]:hidden group-data-[active=true]:text-primary group-data-[active=true]:font-semibold">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
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
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        {/* Modern glassmorphism container */}
        <div className="relative bg-background/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/10 p-2">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 rounded-3xl" />
          
          {/* Navigation items container */}
          <div className="relative flex justify-around items-center">
            {navItems.map((item, index) => {
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
           <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-500 p-6 group-data-[collapsible=icon]:hidden">
              <Avatar className="h-20 w-20 border-4 border-white/50">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="Admin" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-lg font-bold">{profile?.full_name || 'Admin User'}</p>
                <p className="text-sm text-primary-foreground/80">{user?.email}</p>
              </div>
          </div>
          <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex group-data-[state=expanded]:hidden">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || "https://placehold.co/100x100.png"} alt="Admin" data-ai-hint="admin portrait" />
                <AvatarFallback className="text-foreground">{profile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
          </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
           <SidebarNavContent />
        </SidebarContent>

        <SidebarFooter className="p-2">
            <SidebarSeparator className="my-2" />
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        tooltip={{ children: "Ke Dasbor Guru" }}
                        className="group-data-[collapsible=icon]:justify-center"
                    >
                        <Link href="/dashboard" onClick={() => {if (isMobile) toggleSidebar()}}>
                            <UserIcon />
                            <span className="group-data-[collapsible=icon]:hidden">Ke Dasbor Guru</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
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
  )
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import {
  LogOut,
  Settings,
  Home,
  ShieldCheck,
  Ticket,
  Users,
  CalendarCheck,
  School,
  BookOpen,
  Users2,
  ArrowRightLeft,
  GraduationCap,
  Building,
  MapPin,
  MessageSquare,
  CalendarClock,
  CalendarOff,
  ChevronLeft
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: SupabaseUser | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'role'> | null
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
  };

  const NavItem = ({ href, icon: Icon, label, color = "" }: any) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            "rounded-xl transition-all duration-200 h-10",
            isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-100" : "hover:bg-slate-100"
          )}
        >
          <Link href={href}>
            <Icon className={cn("w-4 h-4 mr-2", !isActive && color)} />
            <span className="font-bold">{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
       <Sidebar className="hidden md:flex border-r-purple-100">
          <SidebarHeader className="p-0">
              <div className="bg-gradient-to-br from-purple-800 to-purple-600 p-6 text-white text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                      <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                      <h2 className="font-black text-lg tracking-tight">Panel Admin</h2>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[9px] uppercase tracking-widest mt-1">Superuser Mode</Badge>
                  </div>
              </div>
          </SidebarHeader>
          <SidebarContent className="bg-slate-50">
            <ScrollArea className="flex-1">
                <SidebarGroup className="p-4 pt-6">
                    <SidebarMenu>
                        <SidebarMenuItem className="mb-4">
                            <SidebarMenuButton asChild className="bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-xl shadow-lg">
                                <Link href="/dashboard">
                                    <ChevronLeft className="w-5 h-5 mr-2" />
                                    <span className="font-black">Kembali ke Guru</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Manajemen Staf</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/codes" icon={Ticket} label="Token Aktivasi" color="text-purple-600" />
                      <NavItem href="/admin/users" icon={Users} label="Staf & Approval" color="text-purple-600" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Data Master Rombel</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/roster/school-year" icon={CalendarCheck} label="Tahun Ajaran" color="text-purple-600" />
                      <NavItem href="/admin/roster/classes" icon={School} label="Data Kelas" color="text-purple-600" />
                      <NavItem href="/admin/roster/subjects" icon={BookOpen} label="Data Mapel" color="text-purple-600" />
                      <NavItem href="/admin/roster/students" icon={Users2} label="Data Siswa" color="text-purple-600" />
                      <NavItem href="/admin/roster/promotion" icon={ArrowRightLeft} label="Promosi Siswa" color="text-purple-600" />
                      <NavItem href="/admin/roster/alumni" icon={GraduationCap} label="Arsip Alumni" color="text-purple-600" />
                    </SidebarMenu>

                    <SidebarGroupLabel className="text-purple-600 font-black text-[9px] tracking-[0.2em] uppercase mb-3">Pengaturan Sistem</SidebarGroupLabel>
                    <SidebarMenu className="gap-1 mb-6">
                      <NavItem href="/admin/settings/school" icon={Building} label="Data Sekolah" color="text-purple-600" />
                      <NavItem href="/admin/settings/location" icon={MapPin} label="Setelan Lokasi" color="text-purple-600" />
                      <NavItem href="/admin/settings/whatsapp" icon={MessageSquare} label="WhatsApp API" color="text-purple-600" />
                      <NavItem href="/admin/settings/schedule" icon={CalendarClock} label="Master Jadwal" color="text-purple-600" />
                      <NavItem href="/admin/settings/holidays" icon={CalendarOff} label="Hari Libur" color="text-purple-600" />
                    </SidebarMenu>
                </SidebarGroup>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t bg-slate-50">
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-600 hover:bg-red-50 font-bold rounded-xl h-12">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar Sesi
                </Button>
          </SidebarFooter>
       </Sidebar>

      <SidebarInset className="bg-[#fcfaff]">
        <header className="sticky top-0 z-40 w-full bg-purple-700 text-white shadow-md">
            <div className="flex items-center justify-between h-16 px-4">
                 <div className="flex items-center gap-3">
                     <SidebarTrigger className="text-white hover:bg-white/20 rounded-xl" />
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase opacity-70 tracking-widest">Administrator</span>
                        <h1 className="text-sm font-bold tracking-tight">LakuKelas Master Panel</h1>
                     </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20 font-bold rounded-xl h-10 px-4">
                        <Link href="/dashboard">Panel Guru</Link>
                    </Button>
                </div>
            </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </>
  );
}

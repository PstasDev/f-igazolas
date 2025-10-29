'use client';

import Link from 'next/link';
import { Home, FileText, Settings, Calendar, Clock, CheckCircle2, XCircle, Zap } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { useRole } from '@/app/context/RoleContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface StudentSidebarProps {
  onViewChange: (view: 'overview' | 'pending' | 'approved' | 'rejected' | 'all' | 'bkk-test') => void;
  currentView: string;
  stats?: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

export function StudentSidebar({ onViewChange, currentView, stats }: StudentSidebarProps) {
  const { user } = useRole();

  const mainNav = [
    { title: 'Áttekintés', icon: Home, view: 'overview' as const },
    { title: 'Függőben', icon: Clock, view: 'pending' as const, badge: stats?.pending?.toString() },
    { title: 'Jóváhagyott', icon: CheckCircle2, view: 'approved' as const, badge: stats?.approved?.toString() },
    { title: 'Elutasított', icon: XCircle, view: 'rejected' as const, badge: stats?.rejected?.toString() },
    { title: 'Összes igazolás', icon: FileText, view: 'all' as const, badge: stats?.total?.toString() },
  ];

  const secondaryNav = [
    { title: 'Beállítások', icon: Settings, view: 'overview' as 'overview' | 'pending' | 'approved' | 'rejected' | 'all' | 'bkk-test' },
    { title: 'Órarend', icon: Calendar, view: 'overview' as 'overview' | 'pending' | 'approved' | 'rejected' | 'all' | 'bkk-test' },
    { title: 'BKK Test', icon: Zap, view: 'bkk-test' as 'overview' | 'pending' | 'approved' | 'rejected' | 'all' | 'bkk-test' },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image
                    src="/logo.svg"
                    alt="Szent László Gimnázium"
                    width={24}
                    height={24}
                    className="size-6"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Igazoláskezelő</span>
                  <span className="truncate text-xs">F Tagozat</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigáció</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => onViewChange(item.view)}
                      isActive={currentView === item.view}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>További</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => onViewChange(item.view)}
                      isActive={currentView === item.view}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-[#333C3E] to-[#4a5658] text-white text-xs">
                  {user?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.class}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import { NavLink, useLocation } from "react-router-dom";
import { ClipboardList, MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const AppSidebar = () => {
  const location = useLocation();
  const items = [
    { title: "Chat", url: "/chat", icon: MessageSquare },
    { title: "QA", url: "/qa", icon: ClipboardList },
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/lovable-uploads/389916be-930f-42dc-b755-a2f4c9100e79.png" alt="3echo logo" className="h-6 w-auto" loading="lazy" />
          <span aria-hidden className="text-muted-foreground">×</span>
          <img src="/lovable-uploads/b6db8393-9c7c-4de1-b65c-5aebf510b1ec.png" alt="BSL logo" className="h-6 w-auto rounded-sm" loading="lazy" />
          <div className="ml-1 leading-tight">
            <div className="text-sm font-semibold">3echo × BSL</div>
            <div className="text-xs text-muted-foreground">AI Dashboard</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export const AppSidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">{children}</div>
  </SidebarProvider>
);

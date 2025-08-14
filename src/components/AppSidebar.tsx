import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";
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
  useSidebar,
} from "@/components/ui/sidebar";

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpen } = useSidebar();
  const wasCollapsed = useRef(false);
  const items = [
    { title: "Chat", url: "/chat", icon: MessageSquare },
    { title: "QA", url: "/qa", icon: ClipboardList },
  ];

  // Reset the flag when sidebar is manually expanded
  useEffect(() => {
    if (state === "expanded" && !wasCollapsed.current) {
      // This is a manual expansion, not from navigation
      wasCollapsed.current = false;
    }
  }, [state]);

  // Monitor location changes and force sidebar to stay collapsed
  useEffect(() => {
    if (wasCollapsed.current && state === "expanded") {
      setOpen(false);
    }
  }, [location.pathname, state, setOpen]);

  // Continuous monitoring to force collapse if needed
  useEffect(() => {
    const interval = setInterval(() => {
      if (wasCollapsed.current && state === "expanded") {
        setOpen(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state, setOpen]);

  const handleNavigation = (url: string) => {
    // Remember if sidebar was collapsed
    if (state === "collapsed") {
      wasCollapsed.current = true;
    }
    navigate(url);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-1">
          <img src="/lovable-uploads/389916be-930f-42dc-b755-a2f4c9100e79.png" alt="3echo logo" className="h-6 w-auto min-w-0 flex-shrink-0" loading="lazy" />
          <span aria-hidden className="text-muted-foreground group-data-[collapsible=icon]:hidden">×</span>
          <img src="/lovable-uploads/b6db8393-9c7c-4de1-b65c-5aebf510b1ec.png" alt="BSL logo" className="h-6 w-auto rounded-sm min-w-0 flex-shrink-0" loading="lazy" />
          <div className="ml-1 leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold">3echo × BSL</div>
            <div className="text-xs text-muted-foreground">AI Dashboard</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavigation(item.url);
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
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
  <SidebarProvider defaultOpen={true}>
    <div className="min-h-screen flex w-full">{children}</div>
  </SidebarProvider>
);

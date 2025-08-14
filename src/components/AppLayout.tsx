import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { cn } from "@/lib/utils";

const AppLayout: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <SidebarInset className={cn("min-w-0 overflow-hidden", className)}>
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-3">
          <SidebarTrigger />
          <span className="text-base md:text-lg font-medium text-foreground">BSL AI Dashboard</span>
        </div>
      </header>
      <main className="flex-1 p-6 min-w-0 overflow-hidden">{children}</main>
    </SidebarInset>
  );
};

export default AppLayout;

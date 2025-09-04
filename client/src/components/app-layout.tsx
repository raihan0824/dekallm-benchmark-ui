import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/nav-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

function getBreadcrumbsFromPath(path: string) {
  switch (path) {
    case "/":
      return [
        { label: "Benchmark", href: "/", current: true }
      ];
    case "/data":
      return [
        { label: "Data", href: "/data", current: true }
      ];
    default:
      return [
        { label: "Home", href: "/", current: true }
      ];
  }
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const breadcrumbs = getBreadcrumbsFromPath(location);

  return (
    <SidebarProvider>
      <NavSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <BreadcrumbItem key={item.href}>
                    {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                    {item.current ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={item.href}>
                        {item.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
        
        <div className="mt-auto">
          <AppFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
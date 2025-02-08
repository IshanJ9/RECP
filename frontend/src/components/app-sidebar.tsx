import * as React from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,  } from "./ui/sidebar";
import { FaHome, FaBriefcase, FaTrophy, FaDiscord } from "react-icons/fa"; // Import specific icons
import { MdCompare } from "react-icons/md"; // Correct imports

const data = {
  navMain: [
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Home",
          url: "#",
          icon: FaHome, // Using FaHome icon
        },
        {
          title: "Your Portfolio",
          url: "#",
          icon: FaBriefcase, // Using FaBriefcase icon
          isActive: true,
        },
        {
          title: "Compare",
          url: "#",
          icon: MdCompare, // Using FaTrophy icon
        },
        {
          title: "Leaderboard",
          url: "#",
          icon: FaTrophy, // Using FaTrophy icon
        },
        {
          title: "Discord",
          url: "#",
          icon: FaDiscord, // Using FaDiscord icon
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>Company name</SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>
                        {item.icon && <item.icon />} {item.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

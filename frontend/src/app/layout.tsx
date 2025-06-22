"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/sidebar";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider ,midnightTheme} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import config from "@/wagmiConfig"; // Import wagmi config
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { ThemeProvider } from '@/context/ThemeContext';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  
  // Pages that should not show navbar/sidebar
  const authPages = ['/signin', '/signup'];
  const isAuthPage = authPages.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {/* Wrap with Providers */}
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider
                theme={midnightTheme({
                  accentColorForeground: 'white',
                  borderRadius: 'large',
                  fontStack: 'system',
                  overlayBlur: 'small',
                })}
                coolMode={true}
                >
                
                {isAuthPage ? (
                  /* Auth pages - no navbar/sidebar */
                  <main className="min-h-screen">
                    {children}
                  </main>
                ) : (
                  /* Regular pages - with navbar/sidebar */
                  <>
                    {/* Navbar */}
                    <Navbar />

                    {/* Main container */}
                    <div className="flex">
                      {/* Sidebar */}
                      <aside
                        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transition-all duration-300 ease-in-out ${
                          isExpanded ? "w-64" : "w-16"
                        }`}
                      >
                        <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
                      </aside>

                      {/* Main content */}
                      <main
                        className={`flex-1 transition-all duration-300 pt-16 bg-gray-50 min-h-screen ${
                          isExpanded ? "ml-64" : "ml-16"
                        }`}
                      >
                        <div className="p-8">{children}</div>
                      </main>
                    </div>
                  </>
                )}

              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

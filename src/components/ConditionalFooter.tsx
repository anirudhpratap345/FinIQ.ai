"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "./SiteFooter";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on login page
  if (pathname === "/login") {
    return null;
  }
  
  return <SiteFooter />;
}


export interface NavItem {
  id: string;
  label: string;
  href: string;
  group: "menu" | "general";
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", group: "menu", icon: "home" },
  { id: "mc16", label: "MC16 Alerts", href: "/mc16", group: "menu", icon: "alert" },
  { id: "backlog", label: "Backlog", href: "/backlog", group: "menu", icon: "clock" },
  { id: "pms", label: "PSM Dashboard", href: "/pms", group: "menu", icon: "radio" },
  { id: "mrp", label: "MRP Orders", href: "/mrp", group: "menu", icon: "box" },
  { id: "sc", label: "SC Orders", href: "/sc", group: "menu", icon: "layers" },
  { id: "partials", label: "Partial Delivery SC", href: "/partials", group: "menu", icon: "split" },
  { id: "emails", label: "Email Generator", href: "/emails", group: "general", icon: "mail" },
  { id: "contacts", label: "Supplier Directory", href: "/contacts", group: "general", icon: "book" },
  { id: "tracking", label: "Tracking", href: "/tracking", group: "general", icon: "truck" },
  { id: "todo", label: "Daily To-Do", href: "/todo", group: "general", icon: "check" },
  { id: "profile", label: "My Profile", href: "/profile", group: "general", icon: "user" },
];

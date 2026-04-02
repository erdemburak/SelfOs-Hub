export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Overview" },
  { href: "/todo", label: "ToDo Board", description: "Tasks" },
  { href: "/analytics", label: "Analytics", description: "Insights" },
  { href: "/vocabulary", label: "Vocabulary", description: "Quiz" },
  {
    href: "/password-generator",
    label: "Password Generator",
    description: "Security",
  },
  { href: "/pomodoro", label: "Pomodoro", description: "Focus" },
];

export const PAGE_TITLES: Record<string, string> = NAV_ITEMS.reduce(
  (accumulator, item) => {
    accumulator[item.href] = item.label;
    return accumulator;
  },
  {} as Record<string, string>
);

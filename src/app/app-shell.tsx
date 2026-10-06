import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ChevronLeftIcon, DishesIcon, HistoryIcon, PlanIcon, WeekIcon } from "./icons";

type Section = "week" | "plan" | "dishes" | "history";

const sections: { section: Section; href: string; label: string; Icon: ComponentType }[] = [
  { section: "week", href: "/", label: "This week", Icon: WeekIcon },
  { section: "plan", href: "/plan", label: "Plan", Icon: PlanIcon },
  { section: "dishes", href: "/dishes", label: "Dishes", Icon: DishesIcon },
  { section: "history", href: "/history", label: "History", Icon: HistoryIcon },
];

/**
 * A phone-width column, centred on wider screens, with the main sections in
 * the thumb zone at the bottom.
 */
export function AppShell({ current, children }: { current?: Section; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <main className="flex flex-1 flex-col pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-sheet pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex w-full max-w-md px-1.5 pt-1 pb-3">
          {sections.map(({ section, href, label, Icon }) => (
            <li key={section} className="flex-1">
              <Link
                href={href}
                aria-current={section === current ? "page" : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-ink-soft aria-[current=page]:font-bold aria-[current=page]:text-pen"
              >
                <Icon />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** A page's top bar for screens reached from another: back link and title. */
export function BackHeader({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-2 pt-2.5">
      <Link href={href} aria-label={label} className="icon-btn">
        <ChevronLeftIcon />
      </Link>
      {children}
    </header>
  );
}

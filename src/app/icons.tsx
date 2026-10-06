import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function icon(paths: ReactNode, strokeWidth = 2) {
  return function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const WeekIcon = icon(
  <>
    <rect x="4" y="4" width="16" height="17" rx="2.5" />
    <path d="M8 2.5v3M16 2.5v3M8.5 13l2.5 2.5 4.5-5" />
  </>,
);
export const PlanIcon = icon(
  <>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="M13.5 6.5l4 4" />
  </>,
);
export const DishesIcon = icon(
  <>
    <path d="M3 11h18a9 9 0 0 1-18 0Z" />
    <path d="M9 7c0-1.5 1-1.5 1-3M13 7c0-1.5 1-1.5 1-3" />
  </>,
);
export const HistoryIcon = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);
export const GearIcon = icon(
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const CheckIcon = icon(<path d="M5 12.5l4.5 4.5L19 7.5" />, 3);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />, 2.6);
export const MinusIcon = icon(<path d="M5 12h14" />, 2.6);
export const CloseIcon = icon(<path d="M6 6l12 12M18 6L6 18" />, 2.2);
export const ChevronLeftIcon = icon(<path d="M15 5l-7 7 7 7" />, 2.2);
export const ChevronRightIcon = icon(<path d="M9 5l7 7-7 7" />, 2.2);
export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </>,
  2.2,
);
export const CarryOverIcon = icon(
  <>
    <path d="M4 12h13" />
    <path d="M12 6l6 6-6 6" />
    <path d="M20 5v14" />
  </>,
  2.4,
);
export const BookIcon = icon(
  <>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20" />
  </>,
  2.2,
);
export const ExternalIcon = icon(
  <>
    <path d="M14 4h6v6" />
    <path d="M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </>,
  2.2,
);
export const MailIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7l8 6 8-6" />
  </>,
  2.2,
);

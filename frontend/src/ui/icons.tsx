import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const stroke = (props: IconProps): IconProps => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
  ...props,
})

/** 아래가 톱니 모양인 영수증에 체크 표시를 뚫은 VeriMod 마크. */
export const LogoMark = (props: IconProps) => (
  <svg viewBox="0 0 32 32" aria-hidden focusable={false} {...props}>
    <path d="M6 2.5h20v27l-3.33-2.25-3.34 2.25L16 27.25l-3.33 2.25-3.34-2.25L6 29.5z" fill="currentColor" />
    <path d="m10.8 15.6 3.6 3.6 7-7.2" fill="none" stroke="var(--bg, #0e1119)" strokeWidth="2.6" strokeLinecap="square" />
  </svg>
)

export const ChevronDown = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ChevronLeft = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)

export const ChevronRight = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const ArrowUpRight = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export const SearchIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
)

export const MenuIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const CrossIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
)

export const InputIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <path d="M7 10h7M7 14h4M17 9v6" />
  </svg>
)

export const ScaleIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M12 4v16M7 20h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" />
  </svg>
)

export const ReceiptIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
)

export const ShieldIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const FlaskIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9" />
  </svg>
)

export const FlagIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
)

export const ReviewIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20c.8-3.5 3.6-5.5 7-5.5 1.2 0 2.3.2 3.3.7M15 18l2 2 4-4" />
  </svg>
)

export const LayersIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
)

export const BlocksIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <rect x="3" y="9" width="6" height="6" />
    <rect x="15" y="9" width="6" height="6" />
    <path d="M9 12h6" />
  </svg>
)

export const HashIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M9 3 7 21M17 3l-2 18M4 8.5h17M3 15.5h17" />
  </svg>
)

export const TreeIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <rect x="9.5" y="3" width="5" height="4" />
    <rect x="3" y="17" width="5" height="4" />
    <rect x="16" y="17" width="5" height="4" />
    <path d="M12 7v5M5.5 17v-5h13v5" />
  </svg>
)

export const CodeIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
  </svg>
)

export const BookIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20" />
  </svg>
)

export const QuestionIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
  </svg>
)

export const DatabaseIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
    <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </svg>
)

export const DocIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M14 3H6v18h12V7z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </svg>
)

export const UsersIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.3 3.2-5.3 6.5-5.3s5.9 2 6.5 5.3M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 15c1.6.7 2.7 2.4 3 5" />
  </svg>
)

export const BuildingIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" />
  </svg>
)

export const EyeIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const ExternalIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </svg>
)

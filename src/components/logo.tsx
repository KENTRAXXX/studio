
import { cn } from "@/lib/utils";

const SomaLogo = ({ className, "aria-hidden": ariaHidden = false }: { className?: string, "aria-hidden"?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-6 w-6 text-primary", className)}
    role={ariaHidden ? undefined : "img"}
    aria-label={ariaHidden ? undefined : "SOMA Logo"}
    aria-hidden={ariaHidden}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

export default SomaLogo;

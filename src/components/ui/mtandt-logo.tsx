interface MtandtLogoProps {
  className?: string;
  withTagline?: boolean;
}

export function MtandtLogo({
  className,
}: MtandtLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="MTANDT Logo"
      className={className}
      draggable={false}
    />
  );
}

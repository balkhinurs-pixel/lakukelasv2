import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
    </svg>
  );
}

export function LoginLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 280 60"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="#2ECC71">
        <path d="M41.83,3.92a25,25,0,0,0-26.6,38.23l-1.7,1.7a2,2,0,0,0,0,2.82l5.1,5.1a2,2,0,0,0,2.82,0l1.7-1.7a25,25,0,1,0-21.32-44.35Z" />
        <path d="M28.31,23.36a2,2,0,0,0-2.82,0l-6.1,6.1a2,2,0,0,0,0,2.82l6.1,6.1a2,2,0,0,0,2.82-2.82L25.49,32.64l2.82-2.82A2,2,0,0,0,28.31,23.36Z" />
      </g>
      <text x="75" y="42" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold">
        <tspan fill="#FFFFFF">Laku</tspan>
        <tspan fill="#2ECC71">Kelas</tspan>
      </text>
    </svg>
  );
}

import type { SVGProps } from "react";

export function IconLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 280 60"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(5, 5) scale(1.1)">
        <path d="M26.9,4.3 C24.1,4.3 21.8,6.6 21.8,9.4 L21.8,32.7 C21.8,34.8 20.1,36.5 18,36.5 C15.9,36.5 14.2,34.8 14.2,32.7 L14.2,17.9 C14.2,12.4 9.8,8 4.3,8 C1.9,8 0,9.9 0,12.2 L0,37 C0,43.1 4.9,48 11,48 C16.5,48 21,43.5 21,38 L21,37.5 C22.9,42.1 27.5,45.3 32.9,45.3 C39.6,45.3 45,39.9 45,33.2 C45,26.5 39.6,21.1 32.9,21.1 C30.3,21.1 27.9,21.8 25.9,23.1 L25.9,9.4 C25.9,6.6 23.6,4.3 20.8,4.3 Z M32.9,25.2 C37.1,25.2 40.5,28.7 40.5,32.9 C40.5,37.2 37.1,40.6 32.9,40.6 C28.7,40.6 25.3,37.2 25.3,32.9 C25.3,28.7 28.7,25.2 32.9,25.2 Z" fill="#2ECC71"/>
      </g>
      <text x="75" y="42" fontFamily="Geist, Arial, sans-serif" fontSize="32" fontWeight="bold">
        <tspan fill="#000000">Laku</tspan>
        <tspan fill="#2ECC71">Kelas</tspan>
      </text>
    </svg>
  );
}

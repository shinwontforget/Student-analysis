'use client'

import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon */}
      <polygon
        points="50,5 92,27.5 92,72.5 50,95 8,72.5 8,27.5"
        fill="#8b5cf6"
      />
      {/* Inner Dark Area */}
      <polygon
        points="50,16 80,32 80,68 50,84 20,68 20,32"
        fill="#090814"
      />
      {/* Cross & Downward Arrow Stem */}
      <rect x="44" y="28" width="12" height="38" rx="2" fill="#8b5cf6" />
      <rect x="28" y="40" width="44" height="10" rx="2" fill="#8b5cf6" />
      <path
        d="M 28 55 L 50 72 L 72 55 L 65 50 L 50 62 L 35 50 Z"
        fill="#8b5cf6"
      />
    </svg>
  )
}

export default Logo

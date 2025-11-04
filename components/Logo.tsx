interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 50 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_2135_78)">
        <g filter="url(#filter0_d_2135_78)">
          <path 
            d="M8.33334 12.5V8.33332C8.33334 7.22825 8.77233 6.16845 9.55373 5.38704C10.3351 4.60564 11.3949 4.16666 12.5 4.16666H30.2083L41.6667 15.625V41.6667C41.6667 42.7717 41.2277 43.8315 40.4463 44.6129C39.6649 45.3943 38.6051 45.8333 37.5 45.8333H8.33334" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </g>
        <g filter="url(#filter1_d_2135_78)">
          <path 
            d="M29.1667 4.16666V16.6667H41.6667" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </g>
        <g filter="url(#filter2_d_2135_78)">
          <path 
            d="M21.4375 22.2917C20.7259 21.5811 19.8187 21.0986 18.8317 20.9056C17.8447 20.7127 16.8227 20.8181 15.8958 21.2083C15.2917 21.4583 14.7292 21.8333 14.2708 22.3125L13.5417 23.0208L12.8125 22.3125C12.1049 21.6026 11.2026 21.1187 10.2197 20.9222C9.2369 20.7256 8.21783 20.8252 7.29166 21.2083C6.66666 21.4583 6.12499 21.8333 5.64583 22.3125C3.66666 24.2708 3.56249 27.5833 6.06249 30.1042L13.5417 37.5L21.0417 30.1042C23.5417 27.5833 23.4167 24.2708 21.4375 22.3125V22.2917Z" 
            stroke="#FF6666" 
            strokeWidth="2.8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </g>
      </g>
      <defs>
        <filter id="filter0_d_2135_78" x="3.58334" y="-0.583344" width="42.8333" height="51.1667" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="1.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2135_78"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2135_78" result="shape"/>
        </filter>
        <filter id="filter1_d_2135_78" x="24.4167" y="-0.583344" width="22" height="22" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="1.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2135_78"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2135_78" result="shape"/>
        </filter>
        <filter id="filter2_d_2135_78" x="-3.22797" y="13.4116" width="33.5491" height="31.4884" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="3"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.400962 0 0 0 0 0.400962 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2135_78"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2135_78" result="shape"/>
        </filter>
        <clipPath id="clip0_2135_78">
          <rect width="50" height="50" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

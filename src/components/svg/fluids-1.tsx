interface FluidsProps {
  className?: string;
  mainColor?: string;
  style?: React.CSSProperties;
  color1: string;
  color2: string;
}

export const Fluids1 = ({ className, style, color1, color2 }: FluidsProps) => (
  <svg className={className} style={style} viewBox='0 0 491 440' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <g>
      <path
        className='animate-gradients-floatB delay-100'
        d='M411.931 -52.3151C411.931 -52.3151 465.502 56.0639 444.175 113.635C422.849 171.206 338.106 160.6 314.849 240.206C291.591 319.813 353.182 394.206 282.849 433.206C254.712 448.808 203.698 432.206 125.849 419.206C47.9997 406.206 -11.0483 442.233 -11.0483 442.233L-9.54834 -52.3151H411.931Z'
        fill={`var(--color-${color1})`}
      />
      <path
        className='animate-gradients-floatB delay-200'
        d='M393.849 -14.3171C393.849 -14.3171 419.849 62.6829 402.849 100.683C385.849 138.683 320.849 171.683 304.849 207.683C288.849 243.683 307.849 284.963 304.849 337.323C301.849 389.683 252.849 421.683 216.849 418.683C180.849 415.683 93.5876 396.683 55.2176 391.683C16.8476 386.683 -30.1514 411.683 -30.1514 411.683V-14.3171H393.849Z'
        opacity='0.1'
        fill='black'
      />
      <path
        className='animate-gradients-floatB delay-300'
        d='M291.938 -42.243C291.938 -42.243 384.85 18.206 382.85 84.206C380.85 150.206 302.876 165.206 290.363 215.206C277.85 265.206 318.85 328.206 258.85 376.206C198.85 424.206 6.07893 377.235 -42.1501 320.684C-114.077 236.346 -13.5871 -40.844 -13.5871 -40.844L291.938 -42.243Z'
        fill='url(#paint0_linear_69_15903)'
      />
      <path
        className='animate-gradients-floatB delay-400'
        d='M283.849 -12.3171C283.849 -12.3171 301.849 38.6829 302.849 92.6829C303.849 146.683 272.379 154.683 246.614 197.683C220.849 240.683 250.849 294.499 185.849 327.591C120.849 360.683 -24.1514 256.683 -24.1514 256.683V-12.3171H283.849Z'
        opacity='0.1'
        fill='white'
      />
      <path
        className='animate-gradients-floatB delay-500'
        d='M184.849 -12.3171C184.849 -12.3171 205.849 22.6829 202.849 84.6829C199.849 146.683 189.849 209.683 149.849 226.683C109.849 243.683 86.8486 199.683 45.8486 186.683C4.84863 173.683 -24.1514 184.683 -24.1514 184.683V-12.3171H184.849Z'
        opacity='0.1'
        fill='white'
      />
      <path
        className='animate-gradients-floatB'
        d='M491.386 -10.4702C491.386 -10.4702 465.646 176.139 449.689 228.294C433.732 280.449 392.381 317.231 360.492 335.263C328.603 353.294 313.258 287.34 335.737 232.754C358.216 178.167 425.351 162.745 447.995 125.971C470.64 89.1967 449.227 -8.18184 449.227 -8.18184L473.886 -8.18184L491.386 -10.4702Z'
        opacity='0.1'
        fill={`var(--color-${color1})`}
      />
    </g>
    <defs>
      <linearGradient
        id='paint0_linear_69_15903'
        x1='-115.874'
        y1='-242.763'
        x2='258.126'
        y2='321.237'
        gradientUnits='userSpaceOnUse'
      >
        <stop stopColor={`var(--color-${color2}-900)`} />
        <stop offset='0.0993' stopColor={`var(--color-${color2}-800)`} />
        <stop offset='0.2695' stopColor={`var(--color-${color2}-700)`} />
        <stop offset='0.49' stopColor={`var(--color-${color2}-700)`} />
        <stop offset='0.7492' stopColor={`var(--color-${color2}-600)`} />
        <stop offset='1' stopColor={`var(--color-${color2}-500)`} />
      </linearGradient>
    </defs>
  </svg>
);

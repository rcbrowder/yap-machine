/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
        extend: {
          colors: {
            // Define colors directly with hex values
            main: '#FD9745',
            mainAccent: '#E87928',
            overlay: 'rgba(0, 0, 0, 0.8)',
            bg: '#fff4e0',
            bw: '#fff',
            blank: '#000',
            text: '#000',
            mtext: '#000',
            border: '#000',
            ring: '#000',
            ringOffset: '#fff',
            secondaryBlack: '#212121', 
          },
          borderRadius: {
            base: '4px'
          },
          boxShadow: {
            'neobrutalism': '4px 4px 0px 0px #000'
          },
          translate: {
            'shadowX': '4px',
            'shadowY': '4px',
            'reverseShadowX': '-4px',
            'reverseShadowY': '-4px',
          },
          fontWeight: {
            base: '500',
            heading: '700',
          },
        },
    },
    safelist: [
      'bg-main',
      'bg-mainAccent',
      'bg-bg',
      'bg-bw',
      'text-main',
      'text-blank',
      'text-text',
      'border-border',
      'shadow-neobrutalism'
    ],
    plugins: [
      require('@tailwindcss/typography'),
    ],
} 
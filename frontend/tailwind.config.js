/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    theme: {
        extend: {
          colors: {
            main: 'var(--main)',
            mainAccent: 'var(--mainAccent)',
            overlay: 'var(--overlay)',
            bg: 'var(--bg)',
            bw: 'var(--bw)',
            blank: 'var(--blank)',
            text: 'var(--text)',
            mtext: 'var(--mtext)',
            border: 'var(--border)',
            ring: 'var(--ring)',
            ringOffset: 'var(--ring-offset)',
            
            secondaryBlack: '#212121', 
          },
          borderRadius: {
            base: '4px'
          },
          boxShadow: {
            shadow: 'var(--shadow)'
          },
          translate: {
            boxShadowX: '4px',
            boxShadowY: '4px',
            reverseBoxShadowX: '-4px',
            reverseBoxShadowY: '-4px',
          },
          fontWeight: {
            base: '500',
            heading: '700',
          },
        },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
} 
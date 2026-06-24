const config = {
  plugins: {
    // 1. Plugin untuk Tailwind CSS tetap dipertahankan
    "@tailwindcss/postcss": {},
    
    // 2. Tambahkan plugin pendukung untuk Mantine
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};

export default config;
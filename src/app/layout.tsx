// app/layout.tsx
import '@mantine/core/styles.css';
import './globals.css'; // Pastikan diimpor di bawah style Mantine
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'brandBlue',
  colors: {
    // Daftarkan palet warna dari gambar ke dalam format array 10 warna Mantine
    brandBlue: [
      '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', 
      '#4f46e5', '#0052cc', '#1d4ed8', '#1e40af', '#1e3a8a'
    ],
    brandGreen: [
      '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', 
      '#22c55e', '#16a34a', '#15803d', '#14532d', '#14532d'
    ]
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
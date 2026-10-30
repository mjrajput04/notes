import './globals.css';

export const metadata = {
  title: 'Contract Note Generator',
  description: 'Editable contract note with a pixel-accurate print layout.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

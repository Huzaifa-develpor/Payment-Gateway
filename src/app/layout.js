// app/layout.jsx
// Root layout — wraps every page in the app. Loads global Tailwind styles
// and the two fonts used by the payment designs (Fraunces for Design 1,
// system sans for Design 2's clean look).

import "./globals.css";

export const metadata = {
  title: "Payment Demo",
  description: "Test Premium Plan checkout",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
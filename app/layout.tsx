import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Know Before You Go — DOT Random Testing Generator",
  description:
    "FMCSA-compliant random selection tool for DOT drug & alcohol testing. Testing • Training • Compliance.",
};

const fontLink =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={fontLink} />
      </head>
      <body className="min-h-screen bg-navy-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}

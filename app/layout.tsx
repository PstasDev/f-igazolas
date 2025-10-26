import type { Metadata } from "next";
import { Noto_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import PageTransition from "./components/PageTransition";
import { ThemeProvider } from "./context/ThemeContext";
import { RoleProvider } from "./context/RoleContext";
import { Toaster } from "@/components/ui/sonner";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Igazoláskezelő - Szent László Gimnázium F Tagozat",
  description: "Igazoláskezelő rendszer a Szent László Gimnázium F tagozata számára.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (!theme && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${notoSans.variable} ${playfair.variable} antialiased`}
      >
        <ThemeProvider>
          <RoleProvider>
            <PageTransition>{children}</PageTransition>
            <Toaster />
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

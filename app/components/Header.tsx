'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  subtitle?: string;
}

export default function Header({ subtitle = 'Igazoláskezelő' }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="border-b border-[#333C3E]/10 dark:border-[#3a3f4b] transition-colors bg-white dark:bg-[#242830]">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center gap-6">
          <div className="flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="Szent László Gimnázium"
              width={80}
              height={80}
              priority
              className="w-16 h-16 md:w-20 md:h-20 transition-all"
              style={
                isDark
                  ? { filter: 'brightness(0) saturate(100%) invert(100%)' }
                  : { filter: 'brightness(0) saturate(100%) invert(19%) sepia(9%) saturate(879%) hue-rotate(137deg) brightness(95%) contrast(91%)' }
              }
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-[#333C3E] dark:text-[#e4e6eb] font-serif transition-colors">
              Szent László Gimnázium
            </h1>
            <p className="text-[#333C3E]/70 dark:text-[#b8bcc5] mt-1 transition-colors">{subtitle}</p>
          </div>
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <Navigation />
    </>
  );
}

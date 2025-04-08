"use client";

import React, { useState, useEffect } from "react";
import { Heading } from "@medusajs/ui";
import { useLanguage } from "../../../../i18n/LanguageContext" 
const Hero = () => {
  // Definiere deine 4 Bilder hier als feste URLs
  const images = [
    "https://bucket-production-af40.up.railway.app/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg",
    "https://bucket-production-af40.up.railway.app/medusa-media/IMG-20241117-WA0006.jpg",
    "https://bucket-production-af40.up.railway.app/medusa-media/IMG-20241117-WA0008.jpg",
  ];
  
  const { t } = useLanguage() // Get translation function

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Bild alle 5 Sekunden wechseln
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    
    // Aufräumen beim Unmount der Komponente
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center py-12 border-b border-ui-border-base">
      <div className="text-center mb-8">
        <Heading level="h1">{t('hero.welcometext')}</Heading>
      </div>
      
      <div className="w-full max-w-2xl px-4">
        <img
          src={images[currentIndex]}
          alt=""
          className="w-full h-auto max-h-[80vh]"
          style={{ 
            objectFit: 'contain',
            aspectRatio: '2/3', // Portrait-Orientierung wie in deinem Original
            transition: 'opacity 0.3s ease-in-out' // Sanfter Übergangseffekt
          }}
        />
      </div>
    </div>
  );
};

export default Hero;
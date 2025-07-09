"use client";

import React, { useState, useEffect } from "react";

export default function ImageSlideshow() {
  const images = [
    "https://bucket-production-af40.up.railway.app/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg",
    "https://bucket-production-af40.up.railway.app/medusa-media/IMG-20241117-WA0006.jpg",
    "https://bucket-production-af40.up.railway.app/medusa-media/IMG-20241117-WA0008.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]); // Add dependency to avoid warning

  return (
    <div className="w-full max-w-2xl px-4">
      <img
        src={images[currentIndex]}
        alt="Hero image" // Add descriptive alt text
        className="w-full h-auto max-h-[80vh]"
        style={{ 
          objectFit: 'contain',
          aspectRatio: '2/3',
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
}
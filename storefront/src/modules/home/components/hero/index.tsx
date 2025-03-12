// src/modules/home/components/hero/index.tsx
import React from "react";
import { Heading } from "@medusajs/ui";
import Image from "next/image";

const Hero = () => {
  // Define the image URL (hardcoded for testing)
 const imageUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg`
  
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image 
          src={imageUrl}
          alt="Hero background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center gap-6">
        <Heading level="h1">Welcome to the Store</Heading>
      </div>
    </div>
  );
};

export default Hero;

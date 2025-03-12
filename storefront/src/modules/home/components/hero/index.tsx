import React from "react";
import { Heading } from "@medusajs/ui";
import Image from "next/image";

const Hero = () => {
  const imageUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg`;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 border-b border-ui-border-base">
      <div className="text-center mb-8">
        <Heading level="h1">Welcome to the Store</Heading>
      </div>
      
      <div className="w-full max-w-4xl relative h-[50vh]">
        <Image
          src={imageUrl}
          alt="Store showcase"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default Hero;

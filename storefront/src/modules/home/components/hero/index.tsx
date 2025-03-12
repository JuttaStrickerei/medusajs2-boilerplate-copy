import React from "react";
import { Heading } from "@medusajs/ui";

const Hero = () => {
  const imageUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg`;
  
  return (
    <div 
      className="relative h-[75vh] w-full border-b border-ui-border-base"
      style={{
        backgroundImage: `url('${imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center gap-6">
        <Heading level="h1">Welcome to the Store</Heading>
      </div>
    </div>
  );
};

export default Hero;

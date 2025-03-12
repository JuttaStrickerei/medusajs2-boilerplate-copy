import React from "react";
import { Heading } from "@medusajs/ui";

const Hero = () => {
  const imageUrl = `https://bucket-production-af40.up.railway.app/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg`;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 border-b border-ui-border-base">
      <div className="text-center mb-8">
        <Heading level="h1">Welcome to the Store</Heading>
      </div>
      
      <div className="w-full max-w-2xl px-4">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto max-h-[80vh]"
          style={{ 
            objectFit: 'contain',
            aspectRatio: '2/3' // Portrait orientation matching your image
          }}
        />
      </div>
    </div>
  );
};

export default Hero;

import React from "react";
import { Heading } from "@medusajs/ui";

const Hero = () => {
  const imageUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/medusa-media/DSC09710-01JKBCRRP1H777B1NRDXMJVJBB.jpg`;
  
  return (
    <>
      {/* Add the background image to body using a style tag */}
      <style jsx global>{`
        body {
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }
      `}</style>
      
      <div className="relative h-[75vh] w-full border-b border-ui-border-base">
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center gap-6">
          <Heading level="h1">Welcome to the Store</Heading>
        </div>
      </div>
    </>
  );
};

export default Hero;

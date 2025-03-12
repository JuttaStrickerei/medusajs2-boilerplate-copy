// src/modules/home/components/hero/index.tsx
import React from "react";
import { Heading } from "@medusajs/ui";

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center gap-6">
        <Heading level="h1">Welcome to the Store</Heading>
      </div>
    </div>
  );
};

export default Hero;

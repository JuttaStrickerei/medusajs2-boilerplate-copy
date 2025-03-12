import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import Image from "next/image" // Import the Next.js Image component

const Hero = () => {
  const imageUrl = `${process.env.NEXT_PUBLIC_MINIO_URL}/._IMG_2722-01JP2HDRH327VZ71YQHKPGT2D1.jpg`
  
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      {/* Add the image as a background with overlay */}
      <div className="absolute inset-0">
        <Image 
          src={imageUrl}
          alt="Hero background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        {/* Optional overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-ui-fg-base font-normal"
          >
            Well done! You have successfully deployed your Medusa 2.0 store on Railway!
          </Heading>
          <Heading
            level="h2"
            className="text-3xl leading-10 text-ui-fg-subtle font-normal"
          >
            Need help customizing your store?
          </Heading>
        </span>
        
          href="https://funkyton.com/medusajs-2-0-is-finally-here/"
          target="_blank"
        >
          <h1 style={{ textDecoration: "underline" }}>
            Visit the tutorial
          </h1>
        </a>
      </div>
    </div>
  )
}

export default Hero

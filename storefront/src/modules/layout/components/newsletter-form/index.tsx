"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useState } from "react"
import { toast } from "@medusajs/ui"

const NewsletterForm = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "already_subscribed" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus("idle")
    setMessage("")
    
    try {
      const result = await subscribeToNewsletter(email)
      
      if (result.success) {
        if (result.alreadySubscribed) {
          setStatus("already_subscribed")
          setMessage("You have already subscribed to our newsletter online or at our store!")
          toast.info("You are already subscribed!")
        } else {
          setStatus("success")
          setMessage("Thank you for subscribing! You will receive a confirmation email shortly.")
          setEmail("")
          toast.success("Thanks for subscribing!")
        }
      } else {
        setStatus("error")
        setMessage(result.message || "An error occurred.")
        toast.error(result.message || "An error occurred.")
      }
    } catch (error) {
      console.error(error)
      setStatus("error")
      setMessage("Please enter a valid email address. If you are sure your address is correct, please contact us via our contact form. We are happy to help!")
      toast.error("Please enter a valid email address.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
      <div className="flex-1 max-w-md">
        <h3 className="txt-compact-large-plus mb-2 text-ui-fg-base">Subscribe to our newsletter</h3>
        <p className="text-base-regular text-ui-fg-subtle">
          Receive updates on our latest products and exclusive offers.
        </p>
      </div>
      <div className="flex-1 max-w-md w-full">
        {/* Status Messages */}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}
        
        {status === "already_subscribed" && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}
        
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex gap-x-2">
          <div className="flex-1">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="off"
              required
              data-testid="newsletter-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <SubmitButton data-testid="newsletter-submit-button">
              Subscribe
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewsletterForm


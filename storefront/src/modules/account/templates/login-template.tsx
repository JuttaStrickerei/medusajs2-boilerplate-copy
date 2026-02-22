"use client"

import { useState } from "react"
import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

type LoginTemplateProps = {
  redirectUrl?: string
}

// FIX: Removed duplicate header with logo – the parent (main)/layout.tsx already renders <Nav /> with the logo.
const LoginTemplate = ({ redirectUrl }: LoginTemplateProps) => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="flex items-center justify-center py-12 px-4 bg-stone-50 min-h-[60vh]">
      <div className="w-full max-w-md">
        {currentView === "sign-in" ? (
          <Login setCurrentView={setCurrentView} redirectUrl={redirectUrl} />
        ) : (
          <Register setCurrentView={setCurrentView} />
        )}
      </div>
    </div>
  )
}

export default LoginTemplate

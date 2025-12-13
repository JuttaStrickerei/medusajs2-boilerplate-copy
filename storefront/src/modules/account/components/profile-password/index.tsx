"use client"

import React from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  // TODO: Add support for password updates
  const updatePassword = async () => {
    // Password update functionality not yet implemented
    console.info("Passwort-Aktualisierung noch nicht implementiert")
  }

  const clearState = () => {
    setSuccessState(false)
  }

  return (
    <form
      action={updatePassword}
      onReset={() => clearState()}
      className="w-full"
    >
      <AccountInfo
        label="Passwort"
        currentInfo={
          <span className="text-stone-500 text-sm">
            Das Passwort wird aus Sicherheitsgründen nicht angezeigt
          </span>
        }
        isSuccess={successState}
        isError={false}
        errorMessage={undefined}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
          <Input
            label="Aktuelles Passwort"
            name="old_password"
            required
            type="password"
            data-testid="old-password-input"
          />
          <Input
            label="Neues Passwort"
            type="password"
            name="new_password"
            required
            data-testid="new-password-input"
          />
          <Input
            label="Passwort bestätigen"
            type="password"
            name="confirm_password"
            required
            data-testid="confirm-password-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePassword

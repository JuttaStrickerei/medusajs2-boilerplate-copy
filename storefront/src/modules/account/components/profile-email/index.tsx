"use client"

import React, { useEffect } from "react"
import { useFormState } from "react-dom"

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
// import { updateCustomer } from "@lib/data/customer"
import { useTranslations } from "next-intl"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const t = useTranslations('account')

  // TODO: It seems we don't support updating emails now?
  const updateCustomerEmail = (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const customer = {
      email: formData.get("email") as string,
    }

    try {
      // await updateCustomer(customer)
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useFormState(updateCustomerEmail, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label={t("email")}
        currentInfo={`${customer.email}`}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error}
        clearState={clearState}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label={t('email')}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={customer.email}
            data-testid="email-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail

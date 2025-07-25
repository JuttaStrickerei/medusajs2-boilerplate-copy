"use client"

import React, { useEffect, useMemo } from "react"
import { useTranslations } from "next-intl" // <--- ADD THIS IMPORT

import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"

import AccountInfo from "../account-info"
import { useFormState } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import { updateCustomerAddress } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}

const ProfileBillingAddress: React.FC<MyInformationProps> = ({
  customer,
  regions,
}) => {
  const t = useTranslations('account') // <--- ADD THIS LINE

  const regionOptions = useMemo(() => {
    return (
      regions
        ?.map((region) => {
          return region.countries?.map((country) => ({
            value: country.iso_2,
            label: country.display_name, // country.display_name from Medusa is usually already localized
          }))
        })
        .flat() || []
    )
  }, [regions])

  const [successState, setSuccessState] = React.useState(false)

  const [state, formAction] = useFormState(updateCustomerAddress, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  const currentInfo = useMemo(() => {
    if (!billingAddress) {
      return t("no_billing_address") // <--- TRANSLATE THIS
    }

    const country =
      regionOptions?.find(
        (country) => country?.value === billingAddress.country_code
      )?.label || billingAddress.country_code?.toUpperCase()

    return (
      <div className="flex flex-col font-semibold" data-testid="current-info">
        <span>
          {billingAddress.first_name} {billingAddress.last_name}
        </span>
        <span>{billingAddress.company}</span>
        <span>
          {billingAddress.address_1}
          {billingAddress.address_2 ? `, ${billingAddress.address_2}` : ""}
        </span>
        <span>
          {billingAddress.postal_code}, {billingAddress.city}
        </span>
        <span>{country}</span>
      </div>
    )
  }, [billingAddress, regionOptions, t]) // <--- ADD t to dependency array

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label={t("billing_address")} // <--- TRANSLATE THIS KEY
        currentInfo={currentInfo}
        isSuccess={successState}
        isError={!!state.error}
        // If state.error is a generic string, translate it, otherwise handle it as dynamic message
        errorMessage={state.error ? t("an_error_occurred") : undefined} // <--- TRANSLATE OR HANDLE THIS
        clearState={clearState}
        data-testid="account-billing-address-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <div className="grid grid-cols-2 gap-x-2">
            <Input
              label={t("first_name")} // <--- TRANSLATE THIS
              name="billing_address.first_name"
              defaultValue={billingAddress?.first_name || undefined}
              required
              data-testid="billing-first-name-input"
            />
            <Input
              label={t("last_name")} // <--- TRANSLATE THIS
              name="billing_address.last_name"
              defaultValue={billingAddress?.last_name || undefined}
              required
              data-testid="billing-last-name-input"
            />
          </div>
          <Input
            label={t("company")} // <--- TRANSLATE THIS
            name="billing_address.company"
            defaultValue={billingAddress?.company || undefined}
            data-testid="billing-company-input"
          />
          <Input
            label={t("address")} // <--- TRANSLATE THIS
            name="billing_address.address_1"
            defaultValue={billingAddress?.address_1 || undefined}
            required
            data-testid="billing-address-1-input"
          />
          <Input
            label={t("apartment_suite_etc")} // <--- TRANSLATE THIS
            name="billing_address.address_2"
            defaultValue={billingAddress?.address_2 || undefined}
            data-testid="billing-address-2-input"
          />
          <div className="grid grid-cols-[144px_1fr] gap-x-2">
            <Input
              label={t("postal_code")} // <--- TRANSLATE THIS
              name="billing_address.postal_code"
              defaultValue={billingAddress?.postal_code || undefined}
              required
              data-testid="billing-postcal-code-input"
            />
            <Input
              label={t("city")} // <--- TRANSLATE THIS
              name="billing_address.city"
              defaultValue={billingAddress?.city || undefined}
              required
              data-testid="billing-city-input"
            />
          </div>
          <Input
            label={t("province")} // <--- TRANSLATE THIS
            name="billing_address.province"
            defaultValue={billingAddress?.province || undefined}
            data-testid="billing-province-input"
          />
          <NativeSelect
            name="billing_address.country_code"
            defaultValue={billingAddress?.country_code || undefined}
            required
            data-testid="billing-country-code-select"
          >
            <option value="">{t("select_country_placeholder")}</option> {/* <--- TRANSLATE THIS */}
            {regionOptions.map((option, i) => {
              return (
                <option key={i} value={option?.value}>
                  {option?.label}
                </option>
              )
            })}
          </NativeSelect>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileBillingAddress
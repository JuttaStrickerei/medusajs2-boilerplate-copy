"use client"

import { Plus } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import { useTranslations } from "next-intl" // <--- DIESEN IMPORT HINZUFÜGEN

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@modules/checkout/components/country-select"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import { addCustomerAddress } from "@lib/data/customer"

const AddAddress = ({ region }: { region: HttpTypes.StoreRegion }) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)
  const t = useTranslations('account') // <--- DIESE ZEILE HINZUFÜGEN

  const [formState, formAction] = useFormState(addCustomerAddress, {
    success: false,
    error: null,
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <>
      <button
        className="border border-ui-border-base rounded-rounded p-5 min-h-[220px] h-full w-full flex flex-col justify-between"
        onClick={open}
        data-testid="add-address-button"
      >
        <span className="text-base-semi">{t("new_address")}</span> {/* <--- ÜBERSETZT */}
        <Plus />
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>
          <Heading className="mb-2">{t("add_address")}</Heading> {/* <--- ÜBERSETZT */}
        </Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label={t("first_name")} // <--- ÜBERSETZT (bereits erwähnt)
                  name="first_name"
                  required
                  autoComplete="given-name"
                  data-testid="first-name-input"
                />
                <Input
                  label={t("last_name")} // <--- ÜBERSETZT (bereits erwähnt)
                  name="last_name"
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label={t("company")} // <--- ÜBERSETZT (bereits erwähnt)
                name="company"
                autoComplete="organization"
                data-testid="company-input"
              />
              <Input
                label={t("address")} // <--- ÜBERSETZT (bereits erwähnt)
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label={t("apartment_suite_etc")} // <--- ÜBERSETZT (bereits erwähnt)
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label={t("postal_code")} // <--- ÜBERSETZT (bereits erwähnt)
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />
                <Input
                  label={t("city")} // <--- ÜBERSETZT (bereits erwähnt)
                  name="city"
                  required
                  autoComplete="locality"
                  data-testid="city-input"
                />
              </div>
              <Input
                label={t("province_state")} // <--- ÜBERSETZT
                name="province"
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <CountrySelect
                region={region}
                name="country_code"
                required
                autoComplete="country"
                data-testid="country-select"
                // Die Option des Länder-Dropdowns wird durch `option?.label` gefüllt,
                // das von `region.countries?.map((country) => ({ value: country.iso_2, label: country.display_name }))` kommt.
                // `country.display_name` ist normalerweise bereits lokalisiert durch Medusa selbst.
              />
              <Input
                label={t("phone")} // <--- ÜBERSETZT (bereits erwähnt)
                name="phone"
                autoComplete="tel" // Korrigiert zu "tel"
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div
                className="text-rose-500 text-small-regular py-2"
                data-testid="address-error"
              >
                {/* <--- ÜBERSETZEN ODER HANDHABEN VON FEHLERN HIER */}
                {/* Wenn formState.error ein generischer String ist, wie "An error occurred",
                    dann t("an_error_occurred"), oder einen spezifischeren Schlüssel verwenden. */}
                {t(formState.error, { defaultValue: t("an_error_occurred") })}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10"
                data-testid="cancel-button"
              >
                {t("cancel")} {/* <--- ÜBERSETZT */}
              </Button>
              <SubmitButton data-testid="save-button">
                {t("save")} {/* <--- ÜBERSETZT */}
              </SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress
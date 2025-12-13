"use client"

import { acceptTransferRequest, declineTransferRequest } from "@lib/data/orders"
import { Button } from "@components/ui"
import { useState } from "react"
import { CheckCircle } from "@components/icons"

type TransferStatus = "pending" | "success" | "error"

const TransferActions = ({ id, token }: { id: string; token: string }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<{
    accept: TransferStatus | null
    decline: TransferStatus | null
  } | null>({
    accept: null,
    decline: null,
  })

  const acceptTransfer = async () => {
    setStatus({ accept: "pending", decline: null })
    setErrorMessage(null)

    const { success, error } = await acceptTransferRequest(id, token)

    if (error) setErrorMessage(error)
    setStatus({ accept: success ? "success" : "error", decline: null })
  }

  const declineTransfer = async () => {
    setStatus({ accept: null, decline: "pending" })
    setErrorMessage(null)

    const { success, error } = await declineTransferRequest(id, token)

    if (error) setErrorMessage(error)
    setStatus({ accept: null, decline: success ? "success" : "error" })
  }

  return (
    <div className="flex flex-col gap-y-4">
      {status?.accept === "success" && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={18} />
          <span>Bestellung erfolgreich übertragen!</span>
        </div>
      )}
      {status?.decline === "success" && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={18} />
          <span>Übertragung erfolgreich abgelehnt!</span>
        </div>
      )}
      {status?.accept !== "success" && status?.decline !== "success" && (
        <div className="flex gap-x-4">
          <Button
            onClick={acceptTransfer}
            isLoading={status?.accept === "pending"}
            disabled={
              status?.accept === "pending" || status?.decline === "pending"
            }
          >
            Übertragung akzeptieren
          </Button>
          <Button
            variant="secondary"
            onClick={declineTransfer}
            isLoading={status?.decline === "pending"}
            disabled={
              status?.accept === "pending" || status?.decline === "pending"
            }
          >
            Übertragung ablehnen
          </Button>
        </div>
      )}
      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
    </div>
  )
}

export default TransferActions

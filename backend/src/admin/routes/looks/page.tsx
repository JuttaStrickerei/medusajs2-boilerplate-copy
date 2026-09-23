import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { Swatch } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"
import { LookFormModal } from "./components/look-form-modal"
import type { AdminLook, AdminLookListResponse } from "./components/types"

const PAGE_SIZE = 20

const LooksPage = () => {
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminLook | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["looks", page],
    queryFn: () =>
      sdk.client.fetch<AdminLookListResponse>("/admin/looks", {
        query: { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      }),
  })

  const looks = data?.looks ?? []
  const count = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (look: AdminLook) => {
    setEditing(look)
    setModalOpen(true)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Looks</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Kombinierte Outfits für die „Shop the Look“-Seite
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={openCreate}>
          Look erstellen
        </Button>
      </div>

      {isLoading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Wird geladen …
          </Text>
        </div>
      ) : looks.length === 0 ? (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            Noch keine Looks angelegt.
          </Text>
        </div>
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Look</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Teile</Table.HeaderCell>
                <Table.HeaderCell>Reihenfolge</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {looks.map((look) => (
                <Table.Row
                  key={look.id}
                  className="cursor-pointer"
                  onClick={() => openEdit(look)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {look.images?.[0] ? (
                        <img
                          src={look.images[0]}
                          alt=""
                          className="h-10 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-8 rounded bg-ui-bg-component" />
                      )}
                      <div>
                        <Text size="small" weight="plus">
                          {look.title}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          /looks/{look.handle}
                        </Text>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={look.status === "published" ? "green" : "grey"}
                    >
                      {look.status === "published"
                        ? "Veröffentlicht"
                        : "Entwurf"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{look.items.length}</Table.Cell>
                  <Table.Cell>{look.rank}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <Table.Pagination
            count={count}
            pageSize={PAGE_SIZE}
            pageIndex={page}
            pageCount={pageCount}
            canPreviousPage={page > 0}
            canNextPage={page < pageCount - 1}
            previousPage={() => setPage((p) => Math.max(0, p - 1))}
            nextPage={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            translations={{
              of: "von",
              results: "Looks",
              pages: "Seiten",
              prev: "Zurück",
              next: "Weiter",
            }}
          />
        </>
      )}

      <LookFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        look={editing}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Looks",
  icon: Swatch,
})

export default LooksPage

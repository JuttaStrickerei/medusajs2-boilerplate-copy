import { model } from "@medusajs/framework/utils"
import LookItem from "./look-item"

const Look = model
  .define("look", {
    id: model.id({ prefix: "look" }).primaryKey(),
    title: model.text(),
    handle: model.text().unique(),
    description: model.text().nullable(),
    // Bild-URLs, das erste Bild ist das Hero-Bild
    images: model.array().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
    rank: model.number().default(0),
    metadata: model.json().nullable(),
    items: model.hasMany(() => LookItem, { mappedBy: "look" }),
  })
  .cascades({ delete: ["items"] })

export default Look

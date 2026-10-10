import { model } from "@medusajs/framework/utils"
import Look from "./look"

const LookItem = model.define("look_item", {
  id: model.id({ prefix: "lkitem" }).primaryKey(),
  rank: model.number().default(0),
  look: model.belongsTo(() => Look, { mappedBy: "items" }),
})

export default LookItem

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function importDmMakeup({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("💄 Pokrećem import DM Make-Up proizvoda za Look.ba...")

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const shippingProfile = shippingProfiles[0]

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const lookChannel = salesChannels.find(
    (sc: any) => sc.name.toLowerCase().includes("look") || sc.id === "sc_01M50T97GQ8C8TN9QB5RBG891F"
  )

  if (!lookChannel) {
    logger.error("❌ Look.ba sales channel nije pronađen!")
    return
  }
  logger.info("✅ Koristim Sales Channel: " + lookChannel.name + " (" + lookChannel.id + ")")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  })
  const categoryMap = new Map<string, string>()
  categories.forEach((c: any) => categoryMap.set(c.handle, c.id))
  const rootBeautyCatId = categoryMap.get("kozmetika")

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle))

  const dmProducts = [
  {
    "title": "M. Asam - Foundation Make-Up Classic Teint, 30 ml",
    "handle": "dm-m-asam-foundation-make-up-classic-teint-30-ml-1",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Make-Up Classic Teint, 30 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445851/assets/pas/images/3cd517b0-d08c-4a51-a296-5bad0c1eaf0e/m-asam-foundation-make-up-classic-teint",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445851/assets/pas/images/3cd517b0-d08c-4a51-a296-5bad0c1eaf0e/m-asam-foundation-make-up-classic-teint",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445639/assets/pas/images/9439524a-9f1b-4f39-b786-0a751bb95c1e/m-asam-foundation-make-up-classic-teint",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1776377876/assets/pas/images/0e5c22bd-587c-4c70-9cc2-f593e70d45a8/m-asam-foundation-make-up-classic-teint",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1749774484/assets/pas/images/383b6c52-f21b-423a-9957-8253518caf46/m-asam-foundation-make-up-classic-teint"
    ],
    "price_eur": 22.95,
    "price_bam": 44.89,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-001",
    "brand": "M. Asam"
  },
  {
    "title": "Balea - Getönte Tagescreme Teint Perfektion Magic Teint Creme LSF 15, 50 ml",
    "handle": "dm-balea-getoente-tagescreme-teint-perfektion-ma-2",
    "description": "Originalni Balea proizvod sa dm.de. Getönte Tagescreme Teint Perfektion Magic Teint Creme LSF 15, 50 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1782857085/assets/pas/images/4e13dd89-d95e-4d0b-8c88-198d1fe9dcf2/balea-getoente-tagescreme-teint-perfektion-magic-teint-creme-lsf-15",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1782857085/assets/pas/images/4e13dd89-d95e-4d0b-8c88-198d1fe9dcf2/balea-getoente-tagescreme-teint-perfektion-magic-teint-creme-lsf-15",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1782857108/assets/pas/images/2eb1dfe3-22f0-4597-b5dd-25a6f8b4147c/balea-getoente-tagescreme-teint-perfektion-magic-teint-creme-lsf-15",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1782857103/assets/pas/images/2a9ac427-b595-48a3-bdca-f525a9429166/balea-getoente-tagescreme-teint-perfektion-magic-teint-creme-lsf-15",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1782857080/assets/pas/images/4cec7c03-9288-475d-8b2a-e012e6e2dd61/balea-getoente-tagescreme-teint-perfektion-magic-teint-creme-lsf-15"
    ],
    "price_eur": 5.95,
    "price_bam": 11.64,
    "cat_handle": "njega-lica",
    "sku": "LOOK-DM-002",
    "brand": "Balea"
  },
  {
    "title": "M. Asam - Foundation Glow Make-Up Classic Glow, 30 ml",
    "handle": "dm-m-asam-foundation-glow-make-up-classic-glow-3-3",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Glow Make-Up Classic Glow, 30 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775686208/assets/pas/images/1510c70d-bdb7-49dd-9cd1-c469d3fc7765/m-asam-foundation-glow-make-up-classic-glow",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775686208/assets/pas/images/1510c70d-bdb7-49dd-9cd1-c469d3fc7765/m-asam-foundation-glow-make-up-classic-glow",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1776808109/assets/pas/images/6b5848ba-de74-4c0e-af37-1f3a19fe9c6e/m-asam-foundation-glow-make-up-classic-glow",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775686199/assets/pas/images/97792b9f-d118-41cd-bce3-fd04787af28f/m-asam-foundation-glow-make-up-classic-glow"
    ],
    "price_eur": 26.95,
    "price_bam": 52.71,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-003",
    "brand": "M. Asam"
  },
  {
    "title": "M. Asam - Foundation Make-Up Summer Teint LSF 30, 30 ml",
    "handle": "dm-m-asam-foundation-make-up-summer-teint-lsf-30-4",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Make-Up Summer Teint LSF 30, 30 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445652/assets/pas/images/9d2b3173-27fa-40fd-9966-a68026ac0901/m-asam-foundation-make-up-summer-teint-lsf-30",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445652/assets/pas/images/9d2b3173-27fa-40fd-9966-a68026ac0901/m-asam-foundation-make-up-summer-teint-lsf-30",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747446057/assets/pas/images/40ecb470-24ab-4a37-9ff8-f55e2e22a64e/m-asam-foundation-make-up-summer-teint-lsf-30",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1776808290/assets/pas/images/62e29043-efb6-4eca-b24e-42e6838564c3/m-asam-foundation-make-up-summer-teint-lsf-30",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445861/assets/pas/images/4d060814-db83-4e66-b660-4f155b2ee5b2/m-asam-foundation-make-up-summer-teint-lsf-30"
    ],
    "price_eur": 22.95,
    "price_bam": 44.89,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-004",
    "brand": "M. Asam"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Fixierspray Matte Finish/Long Lasting Make-Up 01, 60 ml",
    "handle": "dm-nyx-professional-makeup-fixierspray-matte-fin-5",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Fixierspray Matte Finish/Long Lasting Make-Up 01, 60 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755098161/assets/pas/images/1f28d2b3-ee82-41a5-9576-32b94593d704/nyx-professional-makeup-fixierspray-matte-finish-long-lasting-make-up-01",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755098161/assets/pas/images/1f28d2b3-ee82-41a5-9576-32b94593d704/nyx-professional-makeup-fixierspray-matte-finish-long-lasting-make-up-01",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755098157/assets/pas/images/081df67c-20ad-4aa7-8a55-54c638bafdfb/nyx-professional-makeup-fixierspray-matte-finish-long-lasting-make-up-01",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755098142/assets/pas/images/e00e53e3-3fa1-438e-a742-02cd8372975c/nyx-professional-makeup-fixierspray-matte-finish-long-lasting-make-up-01",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755098132/assets/pas/images/a5ceab29-57cb-41c1-bf28-1354062c2e16/nyx-professional-makeup-fixierspray-matte-finish-long-lasting-make-up-01"
    ],
    "price_eur": 7.95,
    "price_bam": 15.55,
    "cat_handle": "njega-tijela",
    "sku": "LOOK-DM-005",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "M. Asam - Foundation Make-Up Porcelain Teint LSF 30, 30 ml",
    "handle": "dm-m-asam-foundation-make-up-porcelain-teint-lsf-6",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Make-Up Porcelain Teint LSF 30, 30 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445656/assets/pas/images/f54c4316-b246-4061-b16d-7b1ce1b4b8d5/m-asam-foundation-make-up-porcelain-teint-lsf-30",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445656/assets/pas/images/f54c4316-b246-4061-b16d-7b1ce1b4b8d5/m-asam-foundation-make-up-porcelain-teint-lsf-30",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445656/assets/pas/images/5c996dbd-e559-4784-adf6-3e6f81d2d434/m-asam-foundation-make-up-porcelain-teint-lsf-30",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747610541/assets/pas/images/156b36f7-3d23-4df0-889d-c91fe4b6ddef/m-asam-foundation-make-up-porcelain-teint-lsf-30",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445839/assets/pas/images/ad7ebf20-51e6-40fc-878a-017f291b3464/m-asam-foundation-make-up-porcelain-teint-lsf-30"
    ],
    "price_eur": 22.95,
    "price_bam": 44.89,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-006",
    "brand": "M. Asam"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Fixierspray The Face Glue, Langanhaltend, 60 ml",
    "handle": "dm-nyx-professional-makeup-fixierspray-the-face-7",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Fixierspray The Face Glue, Langanhaltend, 60 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747580341/assets/pas/images/12b3303a-1a37-4a4d-b658-34a42a69f9d4/nyx-professional-makeup-fixierspray-the-face-glue-langanhaltend",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747580341/assets/pas/images/12b3303a-1a37-4a4d-b658-34a42a69f9d4/nyx-professional-makeup-fixierspray-the-face-glue-langanhaltend",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1758057275/assets/pas/images/0abeab2d-4cef-408b-8558-3b99958f7c83/nyx-professional-makeup-fixierspray-the-face-glue-langanhaltend",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1751625096/assets/pas/images/5f13d200-1d7e-431a-9e5d-82e574dd8d56/nyx-professional-makeup-fixierspray-the-face-glue-langanhaltend",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1751625074/assets/pas/images/929a79e7-23e3-4b06-bf6d-161f087d5b4e/nyx-professional-makeup-fixierspray-the-face-glue-langanhaltend"
    ],
    "price_eur": 8.95,
    "price_bam": 17.5,
    "cat_handle": "njega-tijela",
    "sku": "LOOK-DM-007",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "M. Asam - Foundation Perfect Me Make-Up Transparent, 30 ml",
    "handle": "dm-m-asam-foundation-perfect-me-make-up-transpar-8",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Perfect Me Make-Up Transparent, 30 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747446061/assets/pas/images/5e9fd346-5eee-48f0-8508-b24cb6ca2a09/m-asam-foundation-perfect-me-make-up-transparent",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747446061/assets/pas/images/5e9fd346-5eee-48f0-8508-b24cb6ca2a09/m-asam-foundation-perfect-me-make-up-transparent",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747446072/assets/pas/images/1014388e-b89e-4159-a325-16f049ea82a9/m-asam-foundation-perfect-me-make-up-transparent",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445661/assets/pas/images/f6ba0772-cf2b-46a5-b831-4a0093dbc8e2/m-asam-foundation-perfect-me-make-up-transparent",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445867/assets/pas/images/88c41b0a-d6a1-41c2-9c80-789d248c6398/m-asam-foundation-perfect-me-make-up-transparent"
    ],
    "price_eur": 26.95,
    "price_bam": 52.71,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-008",
    "brand": "M. Asam"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Primer The Face Glue Gripping, Hydrating, 35 ml",
    "handle": "dm-nyx-professional-makeup-primer-the-face-glue-9",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Primer The Face Glue Gripping, Hydrating, 35 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747521611/assets/pas/images/39d1f78f-680a-410d-a990-978810019d89/nyx-professional-makeup-primer-the-face-glue-gripping-hydrating",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747521611/assets/pas/images/39d1f78f-680a-410d-a990-978810019d89/nyx-professional-makeup-primer-the-face-glue-gripping-hydrating",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747521985/assets/pas/images/f5938f9b-3e7a-4395-85b3-dd4df1074d34/nyx-professional-makeup-primer-the-face-glue-gripping-hydrating",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747521299/assets/pas/images/8796f477-13bd-4ca9-87c8-02dce1bd0767/nyx-professional-makeup-primer-the-face-glue-gripping-hydrating",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747522230/assets/pas/images/7affbb87-6e3e-408d-b3d0-150a45a91a48/nyx-professional-makeup-primer-the-face-glue-gripping-hydrating"
    ],
    "price_eur": 9.95,
    "price_bam": 19.46,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-009",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Concealer Serum Bare With Me 01 Fair, 9,6 ml",
    "handle": "dm-nyx-professional-makeup-concealer-serum-bare-10",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Concealer Serum Bare With Me 01 Fair, 9,6 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755073596/assets/pas/images/df5b82ca-94a5-4a76-8f74-6ebd0b5b1a7f/nyx-professional-makeup-concealer-serum-bare-with-me-01-fair",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755073596/assets/pas/images/df5b82ca-94a5-4a76-8f74-6ebd0b5b1a7f/nyx-professional-makeup-concealer-serum-bare-with-me-01-fair",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755073604/assets/pas/images/3aad76ca-4697-4606-b6ba-7e68633797f2/nyx-professional-makeup-concealer-serum-bare-with-me-01-fair"
    ],
    "price_eur": 11.95,
    "price_bam": 23.37,
    "cat_handle": "njega-lica",
    "sku": "LOOK-DM-010",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "M. Asam - Foundation Make-Up Classic Teint, 10 ml",
    "handle": "dm-m-asam-foundation-make-up-classic-teint-10-ml-11",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Make-Up Classic Teint, 10 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445642/assets/pas/images/3d4250a8-e335-419b-9d4d-70fe65c4297b/m-asam-foundation-make-up-classic-teint",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445642/assets/pas/images/3d4250a8-e335-419b-9d4d-70fe65c4297b/m-asam-foundation-make-up-classic-teint",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747598406/assets/pas/images/a9d20b06-3e71-4fca-ab3d-64d2472d9d67/m-asam-foundation-make-up-classic-teint",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747445641/assets/pas/images/8ede491a-67de-4fca-baa2-88de75f28c98/m-asam-foundation-make-up-classic-teint",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1776467700/assets/pas/images/ca21bfea-f617-45d9-a3f0-509c25e5ab9e/m-asam-foundation-make-up-classic-teint"
    ],
    "price_eur": 9.95,
    "price_bam": 19.46,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-011",
    "brand": "M. Asam"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Blush Buttermelt 06 For The Butta, 5 g",
    "handle": "dm-nyx-professional-makeup-blush-buttermelt-06-f-12",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Blush Buttermelt 06 For The Butta, 5 g. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755084074/assets/pas/images/b326d7a9-d819-4de2-a529-ba435ab14af0/nyx-professional-makeup-blush-buttermelt-06-for-the-butta",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755084074/assets/pas/images/b326d7a9-d819-4de2-a529-ba435ab14af0/nyx-professional-makeup-blush-buttermelt-06-for-the-butta",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755084086/assets/pas/images/93c57975-a2c1-4968-bfed-73d8dcf23de1/nyx-professional-makeup-blush-buttermelt-06-for-the-butta",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755084072/assets/pas/images/6ce74b4f-3c28-44a9-ab96-2eb2f5352d7b/nyx-professional-makeup-blush-buttermelt-06-for-the-butta",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755084086/assets/pas/images/a4d6932c-4698-46b6-97d3-c2d621419ff6/nyx-professional-makeup-blush-buttermelt-06-for-the-butta"
    ],
    "price_eur": 8.95,
    "price_bam": 17.5,
    "cat_handle": "sjenila-palete",
    "sku": "LOOK-DM-012",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Fixierspray Make Up Dewy Finish/Long Lasting 02, 60 ml",
    "handle": "dm-nyx-professional-makeup-fixierspray-make-up-d-13",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Fixierspray Make Up Dewy Finish/Long Lasting 02, 60 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755099013/assets/pas/images/4e5703a7-69b6-4b17-af2e-75580e5f00e4/nyx-professional-makeup-fixierspray-make-up-dewy-finish-long-lasting-02",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755099013/assets/pas/images/4e5703a7-69b6-4b17-af2e-75580e5f00e4/nyx-professional-makeup-fixierspray-make-up-dewy-finish-long-lasting-02",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755099006/assets/pas/images/50930651-bb38-429f-a181-925f82a988aa/nyx-professional-makeup-fixierspray-make-up-dewy-finish-long-lasting-02",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755099027/assets/pas/images/98b2a05e-b0e6-41ba-b6e7-dbc9918727a6/nyx-professional-makeup-fixierspray-make-up-dewy-finish-long-lasting-02",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755099013/assets/pas/images/688a954b-6360-4347-a6d5-0c63c9319d3f/nyx-professional-makeup-fixierspray-make-up-dewy-finish-long-lasting-02"
    ],
    "price_eur": 7.95,
    "price_bam": 15.55,
    "cat_handle": "njega-tijela",
    "sku": "LOOK-DM-013",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Concealer Serum Bare With Me Vanilla 03, 9,6 ml",
    "handle": "dm-nyx-professional-makeup-concealer-serum-bare-14",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Concealer Serum Bare With Me Vanilla 03, 9,6 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755083403/assets/pas/images/104fd141-38ad-414b-afdd-b18dde8bf90d/nyx-professional-makeup-concealer-serum-bare-with-me-vanilla-03",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755083403/assets/pas/images/104fd141-38ad-414b-afdd-b18dde8bf90d/nyx-professional-makeup-concealer-serum-bare-with-me-vanilla-03"
    ],
    "price_eur": 11.95,
    "price_bam": 23.37,
    "cat_handle": "njega-lica",
    "sku": "LOOK-DM-014",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Fixierpuder High Definition Finishing Powder Translucent 1, 8 g",
    "handle": "dm-nyx-professional-makeup-fixierpuder-high-defi-15",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Fixierpuder High Definition Finishing Powder Translucent 1, 8 g. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755096431/assets/pas/images/bf129f1c-ac68-4f09-9df5-01afe9400cee/nyx-professional-makeup-fixierpuder-high-definition-finishing-powder-translucent-1",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755096431/assets/pas/images/bf129f1c-ac68-4f09-9df5-01afe9400cee/nyx-professional-makeup-fixierpuder-high-definition-finishing-powder-translucent-1",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755096439/assets/pas/images/1ff1b91d-a367-49e4-843a-a6855558c524/nyx-professional-makeup-fixierpuder-high-definition-finishing-powder-translucent-1",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755096443/assets/pas/images/1301549b-c802-4792-bc89-32bfdda61f2d/nyx-professional-makeup-fixierpuder-high-definition-finishing-powder-translucent-1",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747522404/assets/pas/images/b4fd607c-a121-42e3-86be-7836907e0b91/nyx-professional-makeup-fixierpuder-high-definition-finishing-powder-translucent-1"
    ],
    "price_eur": 9.95,
    "price_bam": 19.46,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-015",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Concealer Serum Bare With Me Light 02, 9,6 ml",
    "handle": "dm-nyx-professional-makeup-concealer-serum-bare-16",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Concealer Serum Bare With Me Light 02, 9,6 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755073320/assets/pas/images/ef96d25f-0bac-43cc-b7c0-3e4002932c48/nyx-professional-makeup-concealer-serum-bare-with-me-light-02",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755073320/assets/pas/images/ef96d25f-0bac-43cc-b7c0-3e4002932c48/nyx-professional-makeup-concealer-serum-bare-with-me-light-02",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755073325/assets/pas/images/df647b4d-3d28-492b-8b21-45f91079eba4/nyx-professional-makeup-concealer-serum-bare-with-me-light-02"
    ],
    "price_eur": 11.95,
    "price_bam": 23.37,
    "cat_handle": "njega-lica",
    "sku": "LOOK-DM-016",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "M. Asam - Foundation Glow Make-Up Classic Glow, 10 ml",
    "handle": "dm-m-asam-foundation-glow-make-up-classic-glow-1-17",
    "description": "Originalni M. Asam proizvod sa dm.de. Foundation Glow Make-Up Classic Glow, 10 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775687083/assets/pas/images/24545ee6-dd47-444e-931e-cf48f7413659/m-asam-foundation-glow-make-up-classic-glow",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775687083/assets/pas/images/24545ee6-dd47-444e-931e-cf48f7413659/m-asam-foundation-glow-make-up-classic-glow",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775687074/assets/pas/images/894bd592-81f0-4101-822a-e82365386141/m-asam-foundation-glow-make-up-classic-glow",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1775687066/assets/pas/images/829a3bed-d65d-46e3-8e00-6fc22081968b/m-asam-foundation-glow-make-up-classic-glow"
    ],
    "price_eur": 9.95,
    "price_bam": 19.46,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-017",
    "brand": "M. Asam"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Loses Puder Wonder Snatch 01 Sugar Serve, 6 g",
    "handle": "dm-nyx-professional-makeup-loses-puder-wonder-sn-18",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Loses Puder Wonder Snatch 01 Sugar Serve, 6 g. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1761219165/assets/pas/images/47e7e2e2-3821-47f3-8c96-016e890e073f/nyx-professional-makeup-loses-puder-wonder-snatch-01-sugar-serve",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1761219165/assets/pas/images/47e7e2e2-3821-47f3-8c96-016e890e073f/nyx-professional-makeup-loses-puder-wonder-snatch-01-sugar-serve",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1764372842/assets/pas/images/51642dd2-2a02-482f-a47d-3c8f97e6315e/nyx-professional-makeup-loses-puder-wonder-snatch-01-sugar-serve",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1764372887/assets/pas/images/132fced2-2dc5-44dd-8281-749a3f668535/nyx-professional-makeup-loses-puder-wonder-snatch-01-sugar-serve",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1764372826/assets/pas/images/5c83ab50-8571-4336-9ae4-a40ff5abbed1/nyx-professional-makeup-loses-puder-wonder-snatch-01-sugar-serve"
    ],
    "price_eur": 9.95,
    "price_bam": 19.46,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-018",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Blush Buttermelt 02 Butta Together, 5 g",
    "handle": "dm-nyx-professional-makeup-blush-buttermelt-02-b-19",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Blush Buttermelt 02 Butta Together, 5 g. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747521056/assets/pas/images/f298c628-6491-4e31-b9ab-a15be5a25bd7/nyx-professional-makeup-blush-buttermelt-02-butta-together",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747521056/assets/pas/images/f298c628-6491-4e31-b9ab-a15be5a25bd7/nyx-professional-makeup-blush-buttermelt-02-butta-together",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747520606/assets/pas/images/9051ba9e-f9c4-46c7-854b-10878ee2e3fc/nyx-professional-makeup-blush-buttermelt-02-butta-together",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747520514/assets/pas/images/8d84e7cc-73f6-4a3e-b4fd-b8bc80a2ee45/nyx-professional-makeup-blush-buttermelt-02-butta-together",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1747520612/assets/pas/images/bef24cca-083d-41b9-bc22-4955c9a062da/nyx-professional-makeup-blush-buttermelt-02-butta-together"
    ],
    "price_eur": 8.95,
    "price_bam": 17.5,
    "cat_handle": "sjenila-palete",
    "sku": "LOOK-DM-019",
    "brand": "NYX PROFESSIONAL MAKEUP"
  },
  {
    "title": "NYX PROFESSIONAL MAKEUP - Primer Pore Filler 01, 20 ml",
    "handle": "dm-nyx-professional-makeup-primer-pore-filler-01-20",
    "description": "Originalni NYX PROFESSIONAL MAKEUP proizvod sa dm.de. Primer Pore Filler 01, 20 ml. Dermatološki testirano, profesionalni make-up finiš i dugotrajna postojanost.",
    "thumbnail": "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755095353/assets/pas/images/c389dc84-c3ed-4e49-ac1d-ba405d72fc3d/nyx-professional-makeup-primer-pore-filler-01",
    "images": [
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755095353/assets/pas/images/c389dc84-c3ed-4e49-ac1d-ba405d72fc3d/nyx-professional-makeup-primer-pore-filler-01",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755095358/assets/pas/images/4cc3872e-0cc7-4d98-9684-b1c0e9ad0e7b/nyx-professional-makeup-primer-pore-filler-01",
      "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_800,w_800/v1755095357/assets/pas/images/0854ab22-b916-472b-98c2-13e5c6d20af2/nyx-professional-makeup-primer-pore-filler-01"
    ],
    "price_eur": 14.95,
    "price_bam": 29.24,
    "cat_handle": "puderi-korektori",
    "sku": "LOOK-DM-020",
    "brand": "NYX PROFESSIONAL MAKEUP"
  }
];

  const productsToCreate = dmProducts
    .filter((p) => !existingHandles.has(p.handle))
    .map((p) => {
      const catId = categoryMap.get(p.cat_handle)
      const catList: { id: string }[] = []
      if (rootBeautyCatId) catList.push({ id: rootBeautyCatId })
      if (catId && catId !== rootBeautyCatId) catList.push({ id: catId })

      return {
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile?.id,
        sales_channels: [{ id: lookChannel.id }],
        categories: catList,
        thumbnail: p.thumbnail,
        images: p.images.map((url) => ({ url })),
        options: [{ title: "Standard", values: ["Standard"] }],
        variants: [
          {
            title: "Standard",
            sku: p.sku,
            options: { Standard: "Standard" },
            prices: [
              { amount: p.price_bam, currency_code: "bam" },
              { amount: p.price_eur, currency_code: "eur" },
            ],
          },
        ],
      }
    })

  if (productsToCreate.length === 0) {
    logger.info("ℹ️ Svi DM proizvodi već postoje u bazi.")
    return
  }

  logger.info("📦 Kreiram " + productsToCreate.length + " novih DM proizvoda za Look.ba...")

  await createProductsWorkflow(container).run({
    input: { products: productsToCreate as any },
  })

  logger.info("🎉 Uspješno uvezeno " + productsToCreate.length + " proizvoda sa dm.de za Look.ba!")
}

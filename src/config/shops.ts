/**
 * Centralizovana konfiguracija svih shopova za Backend i Medusa Admin.
 * Kada se dodaje novi shop, dovoljno je dodati ga u SHOPS objekat ovdje.
 */

export interface CategoryConfig {
  name: string
  handle: string
  icon: string // Exact Lucide icon string name (e.g. "Drill", "Wrench", "Sparkles")
  description?: string
}

export interface SalesChannelConfig {
  name: string
  handle: string
  description?: string
}

export interface RootCategoryConfig {
  name: string
  handle: string
}

export interface ShopBrandingConfig {
  logoText: string
  subnavLabel: string
  livePromo: {
    title: string
    badge: string
    link: string
  }
  dealsLabel: string
}

export interface ShopConfig {
  id: string
  name: string
  channel: SalesChannelConfig
  rootCategory: RootCategoryConfig
  categories: CategoryConfig[]
  branding: ShopBrandingConfig
  defaultPort: number
}

// 1. Alati i Mašine Shop
export const ALATI_SHOP: ShopConfig = {
  id: "alati",
  name: "Alati & Mašine",
  channel: {
    name: "Alati Shop",
    handle: "alati",
    description: "Prodajni kanal za električne, akumulatorske i ručne alate",
  },
  rootCategory: {
    name: "Alati i Mašine",
    handle: "alati",
  },
  categories: [
    { name: "Akumulatorski alati", handle: "aku-alati", icon: "Drill" },
    { name: "Ručni alati", handle: "rucni-alati", icon: "Wrench" },
    { name: "Električni alati", handle: "elektricni-alati", icon: "Hammer" },
    { name: "Zaštitna oprema", handle: "zastitna-oprema", icon: "ShieldAlert" },
    { name: "Radionica i Garaža", handle: "radionica", icon: "Warehouse" },
    { name: "Vrt i Bašta", handle: "vrt-i-basta", icon: "Trees" },
    { name: "Pribor & Oprema", handle: "pribor", icon: "Boxes" },
  ],
  branding: {
    logoText: "ALATI",
    subnavLabel: "Kategorije alata",
    livePromo: {
      title: "Alati",
      badge: "Uživo",
      link: "/store",
    },
    dealsLabel: "Najbolje ponude",
  },
  defaultPort: 8000,
}

// 2. Šminka i Kozmetika Shop
export const SMINKA_SHOP: ShopConfig = {
  id: "sminka",
  name: "Šminka & Kozmetika",
  channel: {
    name: "Šminka & Kozmetika Shop",
    handle: "sminka",
    description: "Prodajni kanal za njegu lica, tijela i make-up proizvode",
  },
  rootCategory: {
    name: "Kozmetika i Ljepota",
    handle: "kozmetika",
  },
  categories: [
    { name: "Njega lica i Serumi", handle: "njega-lica", icon: "Sparkles" },
    { name: "Šminka za Usne", handle: "sminka-za-usne", icon: "Heart" },
    { name: "Sjenila i Palete", handle: "sjenila-palete", icon: "Palette" },
    { name: "Puderi i Korektori", handle: "puderi-korektori", icon: "Smile" },
    { name: "Njega Tijela i Kose", handle: "njega-tijela", icon: "Droplets" },
  ],
  branding: {
    logoText: "BEAUTY",
    subnavLabel: "Kategorije ljepote",
    livePromo: {
      title: "Beauty",
      badge: "Uživo",
      link: "/store",
    },
    dealsLabel: "Top Ponude",
  },
  defaultPort: 8001,
}

// Registar svih registrovanih shopova
export const SHOPS: Record<string, ShopConfig> = {
  alati: ALATI_SHOP,
  sminka: SMINKA_SHOP,
}

export const getAllShops = (): ShopConfig[] => {
  return Object.values(SHOPS)
}

export const getShopConfig = (shopId: string): ShopConfig => {
  return SHOPS[shopId] || ALATI_SHOP
}

export const getAllShopRootHandles = (): string[] => {
  return getAllShops().map((s) => s.rootCategory.handle)
}

export const getAllCategoryIconsMap = (): Record<string, string> => {
  const iconMap: Record<string, string> = {}
  getAllShops().forEach((shop) => {
    shop.categories.forEach((cat) => {
      iconMap[cat.handle] = cat.icon
    })
  })
  return iconMap
}

export const getShopByChannelHandle = (channelHandle: string): ShopConfig | undefined => {
  return getAllShops().find((s) => s.channel.handle === channelHandle)
}

"use strict";
/**
 * Centralizovana konfiguracija svih shopova za Backend i Medusa Admin.
 * Kada se dodaje novi shop, dovoljno je dodati ga u SHOPS objekat ovdje.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShopByChannelHandle = exports.getAllCategoryIconsMap = exports.getAllShopRootHandles = exports.getShopConfig = exports.getAllShops = exports.SHOPS = exports.SMINKA_SHOP = exports.ALATI_SHOP = void 0;
// 1. Alati i Mašine Shop
exports.ALATI_SHOP = {
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
};
// 2. Šminka i Kozmetika Shop
exports.SMINKA_SHOP = {
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
};
// Registar svih registrovanih shopova
exports.SHOPS = {
    alati: exports.ALATI_SHOP,
    sminka: exports.SMINKA_SHOP,
};
const getAllShops = () => {
    return Object.values(exports.SHOPS);
};
exports.getAllShops = getAllShops;
const getShopConfig = (shopId) => {
    return exports.SHOPS[shopId] || exports.ALATI_SHOP;
};
exports.getShopConfig = getShopConfig;
const getAllShopRootHandles = () => {
    return (0, exports.getAllShops)().map((s) => s.rootCategory.handle);
};
exports.getAllShopRootHandles = getAllShopRootHandles;
const getAllCategoryIconsMap = () => {
    const iconMap = {};
    (0, exports.getAllShops)().forEach((shop) => {
        shop.categories.forEach((cat) => {
            iconMap[cat.handle] = cat.icon;
        });
    });
    return iconMap;
};
exports.getAllCategoryIconsMap = getAllCategoryIconsMap;
const getShopByChannelHandle = (channelHandle) => {
    return (0, exports.getAllShops)().find((s) => s.channel.handle === channelHandle);
};
exports.getShopByChannelHandle = getShopByChannelHandle;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hvcHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29uZmlnL3Nob3BzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQXlDSCx5QkFBeUI7QUFDWixRQUFBLFVBQVUsR0FBZTtJQUNwQyxFQUFFLEVBQUUsT0FBTztJQUNYLElBQUksRUFBRSxnQkFBZ0I7SUFDdEIsT0FBTyxFQUFFO1FBQ1AsSUFBSSxFQUFFLFlBQVk7UUFDbEIsTUFBTSxFQUFFLE9BQU87UUFDZixXQUFXLEVBQUUsMkRBQTJEO0tBQ3pFO0lBQ0QsWUFBWSxFQUFFO1FBQ1osSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixNQUFNLEVBQUUsT0FBTztLQUNoQjtJQUNELFVBQVUsRUFBRTtRQUNWLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtRQUNuRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzlELEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQ3hFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFO1FBQzNFLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUN0RSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO1FBQzdELEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtLQUM3RDtJQUNELFFBQVEsRUFB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
import { fetchURL } from '../gui/Utils';

const ITEMS_URL = 'https://api.hypixel.net/v2/resources/skyblock/items';
const PRICE_URL = 'https://sky.coflnet.com/api/item/price/';

class SkyblockItemUtil {
    constructor() {
        this.items = new Map();
        this.values = new Map();
        this.loadItems();
    }

    loadItems() {
        try {
            const response = fetchURL(ITEMS_URL);
            const items = JSON.parse(response || '{}').items || [];
            this.items = new Map(items.map((item) => [this.clean(item.name), item]));
        } catch (e) {
            console.error('Failed to load SkyBlock items: ' + e);
        }
    }

    get(name) {
        const key = this.clean(name);
        return this.items.get(key) ?? null;
    }

    getPrice(name) {
        const key = this.clean(name);
        const cached = this.values.get(key);
        if (cached) return cached;

        const item = this.get(name);
        if (!item) return null;

        try {
            const response = fetchURL(`${PRICE_URL}${encodeURIComponent(item.id)}/current?count=1`);
            if (!response) return null;
            const bazaar = JSON.parse(response);
            const value = { NPC: item.npc_sell_price ?? null, SELL: bazaar.sell ?? null, BUY: bazaar.buy ?? null };
            this.values.set(key, value);
            return value;
        } catch (e) {
            console.error(`Failed to load price for ${item.name}: ` + e);
            return null;
        }
    }

    clean(name) {
        return ChatLib.removeFormatting(String(name ?? ''))
            .trim()
            .toLowerCase();
    }
}

export const skyblockItem = new SkyblockItemUtil();

import { bazaarUtil } from '../../utils/BazaarUtil';
import { ModuleBase } from '../../utils/ModuleBase';
import Pathfinder from '../../utils/pathfinder/PathFinder';
import { Guis } from '../../utils/player/Inventory';
import { Keybind } from '../../utils/player/Keybinding';
import { Rotations } from '../../utils/player/Rotations';
import { TabListUtils } from '../../utils/TabListUtils';

const STATES = {
    SEEKING: 'Seeking visitor',
    PATHING: 'Pathing',
    OPENING: 'Opening offer',
    OFFER: 'Checking offer',
    BUYING: 'Buying items',
    ADVANCING: 'Next visitor',
    DONE: 'Done',
};

const INTERACT_DISTANCE = 3;
const RETRY_DELAY_MS = 500;
const OPEN_TIMEOUT_MS = 3000;

export function parseRequiredItems(lore) {
    const items = [];
    let reading = false;

    for (const line of lore || []) {
        const text = ChatLib.removeFormatting(String(line)).trim();
        if (text === 'Items Required:') {
            reading = true;
            continue;
        }
        if (!reading) continue;
        if (text === 'Rewards:') break;

        const match = text.match(/^(.*?)\s+x([\d,]+)$/);
        if (match) items.push({ name: match[1].trim(), count: Number(match[2].replace(/,/g, '')) });
    }

    return items.filter((item) => item.name && Number.isFinite(item.count) && item.count > 0);
}

class VisitorMacro extends ModuleBase {
    constructor() {
        super({
            name: 'Visitor Macro',
            subcategory: 'Farming',
            description: 'Visits garden visitors and buys their requested Bazaar items.',
            tooltip: 'Reads the current visitor list when enabled.',
            isMacro: true,
            autoDisableOnWorldUnload: true,
        });

        this.bindToggleKey();
        this.visitors = [];
        this.visitorIndex = 0;
        this.state = STATES.DONE;
        this.nextActionAt = 0;
        this.pathRequestActive = false;
        this.purchaseIndex = 0;
        this.requiredItems = [];

        this.on('tick', () => this.tick());
    }

    onEnable() {
        this.visitors = TabListUtils.readVisitors();
        this.visitorIndex = 0;
        this.state = this.visitors.length ? STATES.SEEKING : STATES.DONE;
        this.nextActionAt = 0;
        this.pathRequestActive = false;
        this.message(this.visitors.length ? `&aFound ${this.visitors.length} visitors.` : '&eNo visitors found.');
    }

    onDisable() {
        if (Pathfinder.isPathing()) Pathfinder.resetPath();
        Rotations.stop();
        Keybind.stopMovement();
        this.pathRequestActive = false;
    }

    tick() {
        if (!this.enabled) return;

        if (this.state === STATES.OPENING) {
            if (Client.isInGui()) {
                this.state = STATES.OFFER;
                this.nextActionAt = 0;
            } else if (Date.now() >= this.nextActionAt) {
                this.retrySeeking();
            }
            return;
        }

        if (Date.now() < this.nextActionAt) return;

        switch (this.state) {
            case STATES.SEEKING:
                this.seekVisitor();
                break;
            case STATES.OFFER:
                this.checkOffer();
                break;
            case STATES.ADVANCING:
                Guis.closeInv();
                this.visitorIndex++;
                this.state = this.visitorIndex < this.visitors.length ? STATES.SEEKING : STATES.DONE;
                if (this.state === STATES.DONE) {
                    this.message('&aAll stored visitors completed.');
                    this.toggle(false);
                }
                break;
            case STATES.DONE:
                this.toggle(false);
                break;
        }
    }

    seekVisitor() {
        const target = this.visitors[this.visitorIndex];
        if (!target) {
            this.state = STATES.DONE;
            return;
        }

        const entity = this.findVisitor(target);
        if (!entity) return this.retrySeeking();

        if (this.distanceTo(entity) > INTERACT_DISTANCE) return this.pathTo(entity);
        if (Rotations.active) return;

        const aimPoint = Rotations.getAimPoint(entity);
        if (!aimPoint) return this.retrySeeking();

        this.state = STATES.OPENING;
        this.nextActionAt = Date.now() + OPEN_TIMEOUT_MS;
        Rotations.lookAtVector(aimPoint);
        Rotations.onComplete(() => {
            if (!this.enabled || this.state !== STATES.OPENING) return;
            Keybind.leftClick();
        });
    }

    findVisitor(target) {
        const expected = String(target).toLowerCase();
        return World.getAllEntities().find((entity) => {
            const name = ChatLib.removeFormatting(String(entity.getName?.() || ''))
                .trim()
                .toLowerCase();
            return name && (name.includes(expected) || expected.includes(name));
        });
    }

    distanceTo(entity) {
        return Math.hypot(entity.getX() - Player.getX(), entity.getY() - Player.getY(), entity.getZ() - Player.getZ());
    }

    pathTo(entity) {
        if (this.pathRequestActive || Pathfinder.isPathing()) return;

        this.pathRequestActive = true;
        this.state = STATES.PATHING;
        Pathfinder.resetPath();
        Pathfinder.findPath([[Math.floor(entity.getX()), Math.floor(entity.getY()) - 1, Math.floor(entity.getZ())]], () => {
            this.pathRequestActive = false;
            if (!this.enabled) return;
            this.retrySeeking();
        });
    }

    checkOffer() {
        if (!Client.isInGui()) return this.retrySeeking();

        const offer = this.getOffer();
        if (!offer) return;
        if (offer.lore.some((line) => ChatLib.removeFormatting(String(line)).includes('Click to give!'))) {
            Guis.clickSlot(offer.slot, false, 'LEFT');
            this.state = STATES.ADVANCING;
            this.nextActionAt = Date.now() + 750;
            return;
        }

        this.requiredItems = parseRequiredItems(offer.lore);
        if (!this.requiredItems.length) return this.retrySeeking();
        this.purchaseIndex = 0;
        this.buyNextItem();
    }

    getOffer() {
        const container = Player.getContainer();
        if (!container) return null;

        for (let slot = 0; slot < container.getSize(); slot++) {
            const item = container.getStackInSlot(slot);
            if (!item || !ChatLib.removeFormatting(String(item.getName())).includes('Accept Offer')) continue;
            return { slot, lore: item.getLore() || [] };
        }

        return null;
    }

    buyNextItem() {
        const item = this.requiredItems[this.purchaseIndex];
        if (!item) {
            this.state = STATES.SEEKING;
            this.nextActionAt = Date.now() + RETRY_DELAY_MS;
            return;
        }

        this.state = STATES.BUYING;
        bazaarUtil.buy(item.name, item.count, (success) => {
            if (!this.enabled) return;
            if (!success) return this.retrySeeking();
            this.purchaseIndex++;
            this.buyNextItem();
        });
    }

    retrySeeking() {
        this.state = STATES.SEEKING;
        this.nextActionAt = Date.now() + RETRY_DELAY_MS;
    }
}

new VisitorMacro();

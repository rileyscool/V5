import { bazaarUtil } from '../../utils/BazaarUtil';
import { ModuleBase } from '../../utils/ModuleBase';
import Pathfinder from '../../utils/pathfinder/PathFinder';
import { Guis } from '../../utils/player/Inventory';
import { Keybind } from '../../utils/player/Keybinding';
import { Rotations } from '../../utils/player/Rotations';
import { ScheduleTask } from '../../utils/ScheduleTask';
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
const OPEN_TIMEOUT_MS = 1000;
const VISITOR_TIMEOUT_MS = 15_000;
const TELEPORT_RETRY_MS = 1000;
const MISSING_VISITOR_TIMEOUT_MS = 5000;
const VISITOR_BLACKLIST = ['Vinyl Collector', 'Gold Forger'];

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
        items.push({ name: match ? match[1].trim() : text, count: match ? Number(match[2].replace(/,/g, '')) : 1 });
    }

    return items.filter((item) => item.name && Number.isFinite(item.count) && item.count > 0);
}

class VisitorMacro extends ModuleBase {
    constructor() {
        super({
            name: 'Visitor Macro',
            subcategory: 'Farming',
            description: 'Buys requested Bazaar items and accepts garden visitors.',
            tooltip: 'Automatically used in farming macro by rewarp.',
            isMacro: true,
            autoDisableOnWorldUnload: true,
            showEnabledToggle: false,
        });

        this.bindToggleKey();
        this.visitors = [];
        this.visitorIndex = 0;
        this.state = STATES.DONE;
        this.nextActionAt = 0;
        this.pathRequestActive = false;
        this.purchaseIndex = 0;
        this.requiredItems = [];
        this.firstSeek = true;
        this.purchaseFailureAction = 'Decline';
        this.declineCurrentVisitor = false;
        this.maxPrice = 500_000;
        this.visitorStartedAt = 0;
        this.visitorMissingSince = 0;
        this.addSlider(
            'Max Price',
            0,
            5_000_000,
            this.maxPrice,
            (value) => (this.maxPrice = Number(value)),
            'Cancels a Bazaar purchase when its total price is above this amount.'
        );
        this.addMultiToggle(
            'Purchase Failure',
            ['Decline', 'Skip'],
            true,
            (options) => (this.purchaseFailureAction = options.find((option) => option.enabled)?.name || 'Decline'),
            'What to do with a visitor when a Bazaar purchase fails.',
            this.purchaseFailureAction
        );

        this.on('tick', () => this.tick());
    }

    onEnable() {
        this.visitors = TabListUtils.readVisitors();
        this.visitorIndex = 0;
        this.state = this.visitors.length ? STATES.SEEKING : STATES.DONE;
        this.nextActionAt = 0;
        this.pathRequestActive = false;
        this.firstSeek = true;
        this.declineCurrentVisitor = false;
        this.visitorStartedAt = Date.now();
        this.visitorMissingSince = 0;
        this.message(this.visitors.length ? `&aFound ${this.visitors.length} visitors.` : '&eNo visitors found.');
    }

    onDisable() {
        bazaarUtil.cancel();
        if (Pathfinder.isPathing()) Pathfinder.resetPath();
        Rotations.stop();
        Keybind.stopMovement();
        this.pathRequestActive = false;
    }

    tick() {
        if (!this.enabled) return;
        if (this.state !== STATES.ADVANCING && this.state !== STATES.DONE && Date.now() - this.visitorStartedAt >= VISITOR_TIMEOUT_MS)
            return this.skipVisitor();

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
                this.visitors.push(...TabListUtils.readVisitors().filter((visitor) => !this.visitors.includes(visitor)));
                this.firstSeek = true;
                this.declineCurrentVisitor = false;
                this.state = this.visitorIndex < this.visitors.length ? STATES.SEEKING : STATES.DONE;
                this.visitorStartedAt = Date.now();
                this.visitorMissingSince = 0;
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
        if (!entity) {
            const now = Date.now();
            if (!this.visitorMissingSince) this.visitorMissingSince = now;
            if (now - this.visitorMissingSince >= MISSING_VISITOR_TIMEOUT_MS) {
                this.message('&eVisitor not found after teleporting, stopping.');
                return this.toggle(false);
            }
            ChatLib.command('tptoplot barn');
            this.nextActionAt = now + TELEPORT_RETRY_MS;
            return;
        }
        this.visitorMissingSince = 0;

        if (this.distanceTo(entity) > 15) {
            ChatLib.command('tptoplot barn');
            this.nextActionAt = Date.now() + TELEPORT_RETRY_MS;
            return;
        }

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
            if (!this.firstSeek) return;
            this.firstSeek = false;
            ScheduleTask(5, () => {
                if (this.enabled) Keybind.leftClick();
            });
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

        const visitorIndex = this.visitorIndex;
        this.pathRequestActive = true;
        this.state = STATES.PATHING;
        Pathfinder.resetPath();
        Pathfinder.findPath([[Math.floor(entity.getX()), Math.floor(entity.getY()) - 1, Math.floor(entity.getZ())]], () => {
            this.pathRequestActive = false;
            if (!this.enabled || this.state !== STATES.PATHING || this.visitorIndex !== visitorIndex) return;
            this.retrySeeking();
        });
    }

    checkOffer() {
        if (!Client.isInGui()) return this.retrySeeking();

        if (VISITOR_BLACKLIST.includes(this.visitors[this.visitorIndex])) this.declineCurrentVisitor = true;
        if (this.declineCurrentVisitor) {
            const refusal = this.getOffer('Refuse Offer');
            if (!refusal) return this.retrySeeking();
            Guis.clickSlot(refusal.slot, false, 'LEFT');
            return this.advanceVisitor();
        }

        const offer = this.getOffer('Accept Offer');
        if (!offer) return;
        if (offer.lore.some((line) => ChatLib.removeFormatting(String(line)).includes('Click to give!'))) {
            Guis.clickSlot(offer.slot, false, 'LEFT');
            this.state = STATES.ADVANCING;
            this.nextActionAt = Date.now() + 750;
            return;
        }

        this.requiredItems = parseRequiredItems(offer.lore);
        if (!this.requiredItems.length) return this.retrySeeking();
        if (!this.hasInventorySpace()) return this.handlePurchaseFailure();
        this.purchaseIndex = 0;
        this.buyNextItem();
    }

    getOffer(name) {
        const container = Player.getContainer();
        if (!container) return null;

        for (let slot = 0; slot < container.getSize(); slot++) {
            const item = container.getStackInSlot(slot);
            if (!item || !ChatLib.removeFormatting(String(item.getName())).includes(name)) continue;
            return { slot, lore: item.getLore() || [] };
        }

        return null;
    }

    hasInventorySpace() {
        const inventory = Player.getInventory();
        if (!inventory) return false;

        const emptySlots = inventory.getItems().filter((item) => item === null).length;
        const requiredSlots = this.requiredItems.reduce((slots, item) => slots + Math.ceil(item.count / 64), 0);
        return emptySlots >= requiredSlots;
    }

    buyNextItem() {
        const item = this.requiredItems[this.purchaseIndex];
        if (!item) {
            this.state = STATES.SEEKING;
            this.nextActionAt = Date.now();
            return;
        }

        this.state = STATES.BUYING;
        const visitorIndex = this.visitorIndex;
        bazaarUtil.buy(item.name, item.count, this.maxPrice, (success) => {
            if (!this.enabled || this.state !== STATES.BUYING || this.visitorIndex !== visitorIndex) return;
            if (!success) return this.handlePurchaseFailure();
            this.purchaseIndex++;
            this.buyNextItem();
        });
    }

    handlePurchaseFailure() {
        if (this.purchaseFailureAction === 'Skip') return this.advanceVisitor();
        this.declineCurrentVisitor = true;
        this.retrySeeking();
    }

    advanceVisitor() {
        this.state = STATES.ADVANCING;
        this.nextActionAt = Date.now() + 250;
    }

    skipVisitor() {
        if (Pathfinder.isPathing()) Pathfinder.resetPath();
        Rotations.stop();
        Keybind.stopMovement();
        Guis.closeInv();
        this.pathRequestActive = false;
        this.message('&eVisitor timed out, skipping.');
        bazaarUtil.cancel();
        this.advanceVisitor();
    }

    retrySeeking() {
        this.state = STATES.SEEKING;
        this.nextActionAt = Date.now() + 250;
    }
}

new VisitorMacro();

import { MathUtils } from './Math';
import Pathfinder from './pathfinder/PathFinder';
import { Guis } from './player/Inventory';
import { Keybind } from './player/Keybinding';
import { Rotations } from './player/Rotations';

export class CommissionClaimer {
    constructor({ getLocations, ensureToolEquipped, isClaiming, delay, onClaimsExhausted, onPathStart, onPathFailed, canInteract }) {
        this.getLocations = getLocations;
        this.ensureToolEquipped = ensureToolEquipped;
        this.isClaiming = isClaiming;
        this.delay = delay;
        this.onClaimsExhausted = onClaimsExhausted;
        this.onPathStart = onPathStart || (() => {});
        this.onPathFailed = onPathFailed || (() => {});
        this.canInteract = canInteract || (() => true);
        this.npcRotationPending = false;
        this.npcRotationToken = 0;
    }

    handle() {
        if (!Player.getPlayer()) return;

        if (Guis.guiName() === 'Commissions') {
            const container = Player.getContainer();
            if (!container) return;

            if (claimCompletedCommission(container)) {
                this.delay(10);
            } else {
                this.onClaimsExhausted(container);
            }
            return;
        }

        const pigeonSlot = Guis.findItemInHotbar('Royal Pigeon');
        if (pigeonSlot !== -1) {
            if (Player.getHeldItemIndex() !== pigeonSlot) {
                Guis.setItemSlot(pigeonSlot);
                this.delay(3);
            } else {
                Keybind.rightClick();
                this.delay(10);
            }
            return;
        }

        const locations = this.getLocations();
        if (!locations.length) return;

        const closest = this.getClosestLocation(locations);
        const closestDist = MathUtils.fastDistance(Player.getX(), Player.getY(), Player.getZ(), ...closest);
        const target = [closest[0] + 0.5, closest[1] + 2.2, closest[2] + 0.5];

        if (closest[1] - Player.getY() > 3 && closestDist < 10) {
            this.pathToNpc(locations);
            return;
        }

        if (MathUtils.distanceToPlayerPoint(target) <= 3 && !Pathfinder.isPathing()) {
            if (!this.ensureToolEquipped()) return;
            if (Math.abs(Player.getMotionX()) + Math.abs(Player.getMotionZ()) >= 0.04) return;

            if (!Rotations.active) {
                this.npcRotationPending = true;
                const token = ++this.npcRotationToken;
                Rotations.lookAtVector(target);
                Rotations.onComplete(() => {
                    if (!this.npcRotationPending || this.npcRotationToken !== token) return;
                    this.npcRotationPending = false;
                    if (!this.isClaiming() || Pathfinder.isPathing()) return;
                    if (!this.canInteract()) return;
                    Keybind.leftClick();
                    this.delay(10);
                });
            }
            return;
        }

        this.pathToNpc(locations);
    }

    pathToNpc(locations) {
        if (Pathfinder.isPathing()) return;

        this.onPathStart();
        Pathfinder.findPath(locations, (success) => {
            if (!this.isClaiming()) return;
            if (!success) this.onPathFailed();
        });
    }

    getClosestLocation(locations) {
        return locations.reduce((closest, location) => {
            const closestDist = MathUtils.fastDistance(Player.getX(), Player.getY(), Player.getZ(), ...closest);
            const locationDist = MathUtils.fastDistance(Player.getX(), Player.getY(), Player.getZ(), ...location);
            return locationDist < closestDist ? location : closest;
        });
    }

    cancelNpcRotationIfPathing() {
        if (Pathfinder.isPathing()) this.cancelNpcRotation();
    }

    cancelNpcRotation() {
        if (!this.npcRotationPending) return;

        this.npcRotationPending = false;
        this.npcRotationToken++;
        if (Rotations.active) Rotations.stop();
    }
}

function claimCompletedCommission(container) {
    for (let i = 9; i < 17; i++) {
        const stack = container.getStackInSlot(i);
        if (!stack) continue;
        if (!(stack.getLore() || []).some((line) => String(line).includes('COMPLETED'))) continue;

        Guis.clickSlot(i, false);
        return true;
    }
    return false;
}

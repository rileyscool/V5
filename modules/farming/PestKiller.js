import { ModuleBase } from '../../utils/ModuleBase';
import { Guis } from '../../utils/player/Inventory';

class PestSettings extends ModuleBase {
    constructor() {
        super({
            name: 'Pest Settings',
            subcategory: 'Farming',
            description: 'Shared rewarp settings for all farming macros.',
            showEnabledToggle: false,
        });
        this.killNearbyPests = false;
        this.hasReportedMissingVacuum = false;
        this.originalSlot = -1;
        this.addToggle('Kill nearby pests while farming', (value) => (this.killNearbyPests = !!value), 'Pauses farming to kill nearby pests.');
    }

    begin() {
        if (this.originalSlot === -1) this.originalSlot = Player.getHeldItemIndex();
    }

    restoreSlot() {
        if (this.originalSlot !== -1) Guis.setItemSlot(this.originalSlot);
        this.originalSlot = -1;
    }

    selectVacuum() {
        const slot = Guis.findItemInHotbar('Vacuum');
        if (slot < 0) {
            if (!this.hasReportedMissingVacuum) this.message('&cNo Vacuum found in hotbar.');
            this.hasReportedMissingVacuum = true;
            return false;
        }
        this.hasReportedMissingVacuum = false;
        if (Player.getHeldItemIndex() !== slot) {
            Guis.setItemSlot(slot);
            return false;
        }
        return true;
    }
}

export const pestSettings = new PestSettings();

import { ModuleBase } from '../../utils/ModuleBase';

class FarmingSettings extends ModuleBase {
    constructor() {
        super({
            name: 'Farming Settings',
            subcategory: 'Farming',
            description: 'Shared settings for all farming macros.',
            showEnabledToggle: false,
        });

        this.rotationMethod = 'Rotations';
        this.addMultiToggle(
            'Rotation Method',
            ['Rotations', 'Mousemat'],
            true,
            (options) => (this.rotationMethod = options.find((option) => option.enabled)?.name || 'Rotations'),
            `Use Squeaky Mousemat or V5 rotations to face the farming angle.`,
            this.rotationMethod
        );
    }
}

export const farmingSettings = new FarmingSettings();

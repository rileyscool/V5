import { ModuleBase } from '../../utils/ModuleBase';

const MAX_REWARP_DELAY_MS = 2000;

class RewarpSettings extends ModuleBase {
    constructor() {
        super({
            name: 'Rewarp Settings',
            subcategory: 'Farming',
            description: 'Shared rewarp settings for all farming macros.',
            showEnabledToggle: false,
        });

        this.command = 'warp garden';
        this.delayMin = 500;
        this.delayMax = 750;
        this.triggerRadius = 2;
        this.mode = 'Rewarp';
        this.runVisitorMacro = false;
        this.minimumVisitors = 1;

        this.addMultiToggle(
            'Rewarp Mode',
            ['Rewarp', 'Looping'],
            true,
            (options) => (this.mode = options.find((option) => option.enabled)?.name || 'Rewarp'),
            'Rewarp uses the farm endpoint. Looping sets home, runs visitors when the minimum is reached, then warps back to the saved start.',
            this.mode
        );
        this.addTextInput(
            'Rewarp Command',
            this.command,
            (value) =>
                (this.command = String(value || '')
                    .replace(/^\//, '')
                    .trim())
        );
        this.addRangeSlider('Rewarp Delay', 0, MAX_REWARP_DELAY_MS, { low: this.delayMin, high: this.delayMax }, (value) => {
            this.delayMin = Math.round(value.low);
            this.delayMax = Math.round(value.high);
        });
        this.addSlider('Rewarp Trigger Radius', 0.5, 5, this.triggerRadius, (value) => (this.triggerRadius = value));
        this.addToggle(
            'Run Visitor Macro',
            (value) => {
                this.runVisitorMacro = value;
                minimumVisitors.visible = value;
            },
            'Runs before rewarping at the farm endpoint in Rewarp mode.'
        );
        const minimumVisitors = this.addSlider(
            'Minimum Visitors',
            1,
            5,
            this.minimumVisitors,
            (value) => (this.minimumVisitors = Math.round(value)),
            'Runs Visitor Macro when at least this many visitors are waiting.'
        );
        minimumVisitors.visible = false;
    }
}

export const rewarpSettings = new RewarpSettings();

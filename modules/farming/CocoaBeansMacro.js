import { FarmingMacro } from './FarmingMacro';

const STATES = {
    FORWARD: 'Forward',
    BACKWARD: 'Backward',
    SWITCHING_LANE: 'Switching lane',
};

class CocoaBeansMacro extends FarmingMacro {
    constructor() {
        super(
            {
                name: 'Forward S-Shape Cocoa Macro',
                description: 'Forward cocoa S-Shape.',
            },
            'farming cocoa'
        );

        this.state = STATES.FORWARD;
        this.lastDirection = STATES.FORWARD;
        this.moveLeft = true;
        this.addToggle('Move Left', (value) => (this.moveLeft = !!value), 'Use A to change lanes. Disable to use D.', true);
    }

    onFarmStart(player) {
        this.state = STATES.FORWARD;
        this.lastDirection = STATES.FORWARD;
        this.stationaryTicks = 0;
        this.updatePosition(player);
        this.rotateTo(0, -45);
    }

    updateFarmState(player) {
        if (!this.isStationaryForTicks(player, 2)) return;

        this.stationaryTicks = 0;
        if (this.state === STATES.SWITCHING_LANE) {
            this.state = this.lastDirection === STATES.FORWARD ? STATES.BACKWARD : STATES.FORWARD;
            this.lastDirection = this.state;
            return;
        }

        this.lastDirection = this.state;
        this.state = STATES.SWITCHING_LANE;
    }

    invokeFarmState() {
        if (this.state === STATES.FORWARD) return this.hold(false, false, false, false, true);
        if (this.state === STATES.BACKWARD) return this.hold(false, true);
        this.hold(this.moveLeft, false, false, !this.moveLeft);
    }
}

new CocoaBeansMacro();

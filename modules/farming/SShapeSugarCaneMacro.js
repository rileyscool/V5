import { FarmingMacro } from './FarmingMacro';
import { Rotations } from '../../utils/player/Rotations';

const STATES = {
    LEFT: 'Left',
    BACKWARD: 'Backward',
};
class SShapeSugarCaneMacro extends FarmingMacro {
    constructor() {
        super(
            {
                name: 'S-Shape Sugar Cane Macro',
                description: '45° sugar cane S-Shape.',
            },
            'farming cane'
        );

        this.state = STATES.LEFT;
        this.lastDirection = STATES.LEFT;
        this.addLaneSwitchDelaySettings();
    }

    onFarmStart(player) {
        this.state = this.lastDirection;
        this.ignoreTicks = 5;
        this.stationaryTicks = 0;
        this.updatePosition(player);
        Rotations.lookAtAngles(this.snapYaw(player.getYRot(), 45), 0);
    }

    updateFarmState(player) {
        if (this.ignoreTicks > 0) {
            this.ignoreTicks--;
            this.updatePosition(player);
            return;
        }

        if (!this.isStationaryForTicks(player, 2)) return;
        this.stationaryTicks = 0;
        this.lastDirection = this.state === STATES.LEFT ? STATES.BACKWARD : STATES.LEFT;
        this.state = this.lastDirection;
        this.ignoreTicks = Math.round(this.getLaneSwitchDelay() / 50);
    }

    invokeFarmState() {
        if (this.state === STATES.LEFT) return this.hold(true, false);
        if (this.state === STATES.BACKWARD) return this.hold(false, true);
    }
}

new SShapeSugarCaneMacro();

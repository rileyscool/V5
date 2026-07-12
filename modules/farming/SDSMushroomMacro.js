import { FarmingMacro } from './FarmingMacro';
import { Rotations } from '../../utils/player/Rotations';

const STATES = {
    LEFT: 'Left',
    BACKWARD: 'Backward',
    RIGHT: 'Right',
};

class SDSMushroomMacro extends FarmingMacro {
    constructor() {
        super(
            {
                name: 'SDS Staircase Mushroom Macro',
                description: 'Staircase Mushroom Farming.',
            },
            'farming sds mushroom'
        );

        this.state = STATES.LEFT;
        this.lastDirection = STATES.LEFT;
    }

    onFarmStart(player) {
        this.state = this.lastDirection;
        this.ignoreTicks = 20;
        this.stationaryTicks = 0;
        this.updatePosition(player);
        Rotations.lookAtAngles(this.snapYaw(player.getYRot(), -16), 6.7);
    }

    updateFarmState(player) {
        if (this.ignoreTicks > 0) {
            this.ignoreTicks--;
            this.updatePosition(player);
            return;
        }

        if (!this.isStationaryForTicks(player, 2)) return;
        this.stationaryTicks = 0;
        this.state = this.state === STATES.LEFT ? STATES.BACKWARD : this.state === STATES.BACKWARD ? STATES.RIGHT : STATES.LEFT;
        this.lastDirection = this.state;
        this.ignoreTicks = 2;
    }

    invokeFarmState() {
        if (this.state === STATES.LEFT) return this.hold(true, false);
        if (this.state === STATES.BACKWARD) return this.hold(false, true);
        if (this.state === STATES.RIGHT) return this.hold(false, false, false, true);
    }
}

new SDSMushroomMacro();

import { FarmingMacro } from './FarmingMacro';
import { Rotations } from '../../utils/player/Rotations';

const STATES = {
    LEFT: 'Left',
    RIGHT: 'Right',
    ROTATING: 'Rotating',
};
class ADRotatingMelonMacro extends FarmingMacro {
    constructor() {
        super(
            {
                name: 'AD Rotating Melon Macro',
                description: 'Useful for default preset. Not recommended to use.',
            },
            'farming melon'
        );

        this.state = STATES.LEFT;
        this.startState = STATES.LEFT;
        this.pauseForRotations = false;

        this.addMultiToggle(
            'Direction',
            ['A', 'D'],
            true,
            (value) => {
                this.startState = value.find((option) => option.enabled)?.name === 'D' ? STATES.RIGHT : STATES.LEFT;
            },
            'Starting key. The macro swaps to the other key at every lane change.',
            'A'
        );
        this.addLaneSwitchDelaySettings();
    }

    onFarmStart(player) {
        this.state = this.startState;
        this.updatePosition(player);
        this.stationaryTicks = 0;
        this.ignoreTicks = 5;
        this.leftYaw = this.snapYaw(player.getYRot(), 45) - (this.state === STATES.RIGHT ? 90 : 0);
        Rotations.lookAtAngles(this.state === STATES.LEFT ? this.leftYaw : this.leftYaw + 90, 42);
    }

    updateFarmState(player) {
        if (this.state === STATES.ROTATING) return;

        if (this.ignoreTicks > 0) {
            this.ignoreTicks--;
            this.updatePosition(player);
            return;
        }

        if (!this.isStationaryForTicks(player, 2)) return;
        this.stationaryTicks = 0;
        this.nextState = this.state === STATES.LEFT ? STATES.RIGHT : STATES.LEFT;
        this.state = STATES.ROTATING;
        Rotations.lookAtAngles(this.nextState === STATES.LEFT ? this.leftYaw : this.leftYaw + 90, 42);
        Rotations.onComplete(() => {
            if (!this.enabled) return;
            this.state = this.nextState;
            this.ignoreTicks = Math.round(this.getLaneSwitchDelay() / 50);
        });
    }

    invokeFarmState() {
        if (this.state === STATES.ROTATING) return this.hold(false, false);
        this.hold(this.state === STATES.LEFT, false, false, this.state === STATES.RIGHT);
    }
}

new ADRotatingMelonMacro();

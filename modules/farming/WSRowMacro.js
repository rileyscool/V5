import { FarmingMacro } from './FarmingMacro';
import { Utils } from '../../utils/Utils';

const STATES = {
    FORWARD: 'Forward',
    BACKWARD: 'Backward',
};
export class WSRowMacro extends FarmingMacro {
    constructor(options, commandPrefix, yaw, defaultPitch = 0, usesAD = false) {
        super(options, commandPrefix);
        this.yaw = yaw;
        this.pitchMin = defaultPitch;
        this.pitchMax = defaultPitch;
        this.usesAD = usesAD;
        this.state = STATES.FORWARD;
        this.lastDirection = STATES.FORWARD;
        this.addRangeSlider(
            'Pitch',
            -90,
            90,
            { low: this.pitchMin, high: this.pitchMax },
            (value) => {
                this.pitchMin = value.low;
                this.pitchMax = value.high;
            },
            'Random pitch.'
        );
        this.addLaneSwitchDelaySettings();
    }

    onFarmStart(player) {
        this.state = this.lastDirection;
        this.ignoreTicks = 20;
        this.stationaryTicks = 0;
        this.updatePosition(player);
        this.rotateTo(this.snapYaw(player.getYRot(), this.yaw), Utils.randomFloat(this.pitchMin, this.pitchMax));
    }

    updateFarmState(player) {
        if (this.ignoreTicks > 0) {
            this.ignoreTicks--;
            this.updatePosition(player);
            return;
        }

        const stationary = player.getX() === this.previousTickX && player.getZ() === this.previousTickZ;
        this.updatePosition(player);
        if (!stationary) {
            this.stationaryTicks = 0;
            return;
        }

        if (!this.stationaryTicks) this.stationaryDelayTicks = Math.round(this.getLaneSwitchDelay() / 50);
        if (++this.stationaryTicks < this.stationaryDelayTicks) return;

        this.stationaryTicks = 0;
        this.state = this.state === STATES.BACKWARD ? STATES.FORWARD : STATES.BACKWARD;
        this.lastDirection = this.state;
        this.ignoreTicks = 5;
    }

    invokeFarmState() {
        if (this.state === STATES.FORWARD) return this.hold(this.usesAD, false, false, false, !this.usesAD);
        if (this.state === STATES.BACKWARD) return this.hold(false, !this.usesAD, false, this.usesAD);
    }
}

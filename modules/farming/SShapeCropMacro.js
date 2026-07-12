import { FarmingMacro } from './FarmingMacro';
import { Rotations } from '../../utils/player/Rotations';

const STATES = {
    LEFT: 'Left',
    RIGHT: 'Right',
    SWITCHING_LANE: 'Switching lane',
};
class SShapeCropMacro extends FarmingMacro {
    constructor(name = 'S-Shape Crop Macro', commandPrefix = 'farming sshape', pitch = 0) {
        super(
            {
                name,
                description: 'Simple horizonal S-Shape crop macro.',
            },
            commandPrefix
        );

        this.pitch = pitch;
        this.state = STATES.LEFT;
        this.lastDirection = STATES.LEFT;
        this.addLaneSwitchDelaySettings();
    }

    onFarmStart(player) {
        this.state = this.lastDirection;
        this.rowIgnoreTicks = 10;
        this.stationaryTicks = 0;
        this.yaw = this.snapYaw(player.getYRot(), 0);
        this.updatePosition(player);
        Rotations.lookAtAngles(this.yaw, this.pitch);
    }

    updateFarmState(player) {
        if (this.state === STATES.SWITCHING_LANE) return this.updateLaneSwitch(player);
        if (this.rowIgnoreTicks > 0) {
            this.rowIgnoreTicks--;
            this.updatePosition(player);
            return;
        }

        if (!this.isStationaryForTicks(player, 2)) return;
        this.stationaryTicks = 0;
        this.directionState = this.state;
        this.state = STATES.SWITCHING_LANE;
        this.currentStartLane = this.currentLane(player);
    }

    updateLaneSwitch(player) {
        const currentLane = this.currentLane(player);
        const advanced = currentLane !== this.currentStartLane;
        if (!this.isStationaryForTicks(player, 2)) return;
        this.stationaryTicks = 0;
        this.state = this.directionState === STATES.RIGHT ? STATES.LEFT : STATES.RIGHT;
        this.lastDirection = this.state;
        this.rowIgnoreTicks = Math.round(this.getLaneSwitchDelay() / 50);
        if (!advanced) this.message('&eForward lane blocked, reversing row.');
    }

    invokeFarmState() {
        if (this.state === STATES.LEFT) return this.hold(true, false);
        if (this.state === STATES.RIGHT) return this.hold(false, false, false, true);
        if (this.state === STATES.SWITCHING_LANE) return this.hold(false, false, false, false, true);
    }

    currentLane(player) {
        return Math.abs(Math.sin((this.yaw * Math.PI) / 180)) > Math.abs(Math.cos((this.yaw * Math.PI) / 180)) ? player.getX() : player.getZ();
    }
}

new SShapeCropMacro();
new SShapeCropMacro('S-Shape Cactus Macro', 'farming sshape cactus');
new SShapeCropMacro('S-Shape Melon Macro', 'farming sshape melon', 26.4);

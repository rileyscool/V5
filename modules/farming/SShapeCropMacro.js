import { FarmingMacro } from './FarmingMacro';

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
        this.ignoreTicks = 10;
        this.yaw = this.snapYaw(player.getYRot(), 0);
        this.rotateTo(this.yaw, this.pitch);
    }

    updateFarmState(player) {
        if (this.state === STATES.SWITCHING_LANE) return this.updateLaneSwitch(player);
        if (this.consumeIgnoreTicks(player)) return;

        if (!this.isStationaryForTicks(player, 2)) return;
        this.state = STATES.SWITCHING_LANE;
    }

    updateLaneSwitch(player) {
        if (!this.isStationaryForTicks(player, 2)) return;
        this.state = this.lastDirection === STATES.RIGHT ? STATES.LEFT : STATES.RIGHT;
        this.lastDirection = this.state;
        this.ignoreTicks = this.getLaneSwitchDelayTicks();
    }

    invokeFarmState() {
        if (this.state === STATES.LEFT) return this.hold('a');
        if (this.state === STATES.RIGHT) return this.hold('d');
        this.hold('w');
    }
}

new SShapeCropMacro();
new SShapeCropMacro('S-Shape Cactus Macro', 'farming sshape cactus');
new SShapeCropMacro('S-Shape Melon Macro', 'farming sshape melon', 26.4);

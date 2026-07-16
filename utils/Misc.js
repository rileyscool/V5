import { Chat } from './Chat';
import { MiningUtils } from './MiningUtils';
import { v5Command } from './V5Commands';

v5Command('debug info', () => {
    let target = Player.lookingAt();
    if (!target) {
        Chat.message('You are not looking at anything');
        return;
    }
    if (target instanceof Block) {
        const registryName = target.type?.getRegistryName?.();
        const blockInfo = MiningUtils.getBlockInfo(registryName);
        const displayRegistry = registryName || 'unknown';

        Chat.message('blockid: ' + (target.type?.getID?.() ?? 'unknown'));
        Chat.message('registry: ' + displayRegistry);
        Chat.message('x: ' + target.x + ' y: ' + target.y + ' z:' + target.z);
        if (blockInfo) {
            Chat.message('block name: ' + blockInfo.name);
            Chat.message('block hardness: ' + blockInfo.hardness);
        }
    } else if (target instanceof Entity) {
        Chat.message('name: ' + target?.getName());
        Chat.message('entity type: ' + target?.toMC()?.getType());
        Chat.message('x: ' + target?.getX().toFixed(4) + ' y: ' + target?.getY().toFixed(4) + ' z:' + target?.getZ().toFixed(4));
        Chat.message('health: ' + target?.toMC()?.getHealth());
        Chat.message('max health: ' + target?.toMC()?.getMaxHealth());
        Chat.message('UUID: ' + target?.getUUID());
    } else {
        Chat.message('You are not looking at a block or item');
    }
});

v5Command('debug istranslucent', () => {
    const block = Player.lookingAt();
    if (!block) {
        Chat.message('You are not looking at a block');
        return;
    }
    Chat.message(block?.type?.isTranslucent());
});

'use strict'

import * as constants from '/game/constants';

export function captureTheFlagTowers(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers) {
    for (let tower of myTowers) {
        // Skip if below minimum or on cooldown
        if (tower.store.energy < constants.TOWER_ENERGY_COST) continue;

        // Filter range
        myCreeps = myCreeps.filter((c) => tower.getRangeTo(c) <= constants.TOWER_RANGE);
        enemyCreeps = enemyCreeps.filter((c) => tower.getRangeTo(c) <= constants.TOWER_RANGE);
        let wounded = myCreeps.filter((c) => c.hits < c.hitsMax && tower.getRangeTo(c) <= constants.TOWER_RANGE);

        // Always Defend otherwise try to heal
        let threateningEnemies = myFlag.findInRange(enemyCreeps, 6);
        if (threateningEnemies.length) {
            tower.attack(myFlag.findClosestByPath(threateningEnemies));
            continue;
        } else if (tower.store.energy > constants.TOWER_ENERGY_COST * 2 && wounded.length) {
            let healOrder = wounded.filter((c) => c.body.some((b) => b.type === constants.HEAL)) || wounded;
            tower.heal(tower.findClosestByRange(healOrder));
            continue;
        }

        // Headshot when possible
        let killableEnemy = enemyCreeps.find((c) => c.hits < determineDamage(tower.getRangeTo(c)));
        if (killableEnemy) {
            tower.attack(killableEnemy);
        }
    }
}

// Computes damage base on range
function determineDamage(range) {
    if (range <= constants.TOWER_OPTIMAL_RANGE) {
        return constants.TOWER_POWER_ATTACK;
    } else if (range < constants.TOWER_FALLOFF_RANGE) {
        return constants.TOWER_POWER_ATTACK - 37.5 * (range - 5) / 15;
    } else {
        return 37.5;
    }
}
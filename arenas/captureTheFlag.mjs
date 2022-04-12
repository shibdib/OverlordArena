'use strict'

import {captureTheFlagTowers} from '../tactics/towerTactics.mjs';
import * as util from '/game/utils';
import * as prototype from '/game/prototypes';
import * as arena from '/arena/prototypes';
import * as constants from '/game/constants';

export function captureTheFlag() {
    // Find creeps/flags/towers
    let myCreeps = util.getObjectsByPrototype(prototype.Creep).filter(object => object.my);
    let enemyCreeps = util.getObjectsByPrototype(prototype.Creep).filter(object => !object.my);
    let myFlag = util.getObjectsByPrototype(arena.Flag).filter(object => object.my)[0];
    let enemyFlag = util.getObjectsByPrototype(arena.Flag).filter(object => !object.my)[0];
    let myTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => object.my);
    let enemyTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => !object.my);

    // Manage towers
    captureTheFlagTowers(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers);

    // Establish teams
    setFireTeams(myCreeps);

    // Team control
    teamTactics(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers);
}

function teamTactics(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers) {
    // Handle 1 team
    if (noTeamReset) {
        
    } // Handle 2 teams
    else {
        let teamOne = myCreeps.filter((c) => c.team === 1);
        let teamTwo = myCreeps.filter((c) => c.team === 2);
        teamOne.forEach((c) => c.moveTo(34, 65));
        teamTwo.forEach((c) => c.moveTo(65, 34));
    }
}

// Set up the 2 fire teams for the crossing, recheck every 50 ticks
let teamsSet, noTeamReset;

function setFireTeams(myCreeps) {
    if ((teamsSet && teamsSet + 50 > util.getTicks()) || noTeamReset) return;
    // If below critical mass, everyone one team
    if (teamsSet && myCreeps.length <= 10) {
        noTeamReset = true;
        myCreeps.forEach((c) => c.team = 1);
        return;
    }
    teamsSet = util.getTicks();
    let teamOne = myCreeps.filter((c) => c.team === 1);
    let teamTwo = myCreeps.filter((c) => c.team === 2);
    // If teams are set and have the same number return
    if (teamOne.length && teamTwo.length && teamOne.length === teamTwo.length) return;
    let rangers = myCreeps.filter((c) => c.body.some((b) => b.type === constants.RANGED_ATTACK && b.type !== constants.ATTACK));
    let melee = myCreeps.filter((c) => c.body.some((b) => b.type === constants.ATTACK));
    let healers = myCreeps.filter((c) => c.body.some((b) => b.type === constants.HEAL && b.type !== constants.ATTACK && b.type !== constants.RANGED_ATTACK));
    // Handle initial set
    if (!teamOne.length && !teamTwo.length) {
        let teamNumber = 1;
        // Split rangers
        console.log(rangers.length)
        for (let i = 0; i < rangers.length; i++) {
            if (i + 1 > rangers.length * 0.5) teamNumber = 2
            console.log('i ' + i)
            console.log('team ' + teamNumber)
            rangers[i].team = teamNumber;
        }
        // Split melee
        teamNumber = 1;
        for (let i = 0; i < melee.length; i++) {
            if (i + 1 > melee.length * 0.5) teamNumber = 2;
            melee[i].team = teamNumber;
        }
        // Split healers
        teamNumber = 1;
        for (let i = 0; i < healers.length; i++) {
            if (i + 1 > healers.length * 0.5) teamNumber = 2;
            healers[i].team = teamNumber;
        }
    } // Handle balancing
    else {

    }
}
'use strict'

import { arenaInfo } from '/game'
import { captureTheFlag } from './arenas/captureTheFlag.mjs'

// Determine arena and run tactics for that
export function loop() {
    switch (arenaInfo.name) {
        case 'Capture the Flag':
            return captureTheFlag();
        default:
            throw `Unsupported arena: ${arenaInfo.name}`
    }
}
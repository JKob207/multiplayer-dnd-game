import type { MonsterDefinition } from "../../shared/interfaces.js";

export const monsterDefinitions: Record<string, MonsterDefinition> = {
    zombie: {
        type: "zombie",
        name: "Zombie",
        maxHp: 100,
        visionRange: 150,
        visionAngle: Math.PI / 3,
        detectionBehavior: "vision",
    },

    slime: {
        type: "slime",
        name: "Cave Slime",
        maxHp: 70,
        visionRange: 100,
        visionAngle: Math.PI * 2,
        detectionBehavior: "proximity",
    },

    skeleton: {
        type: "skeleton",
        name: "Skeleton",
        maxHp: 85,
        visionRange: 220,
        visionAngle: Math.PI / 2,
        detectionBehavior: "vision",
    },
};
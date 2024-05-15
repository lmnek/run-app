import { logger } from "./logger"
import { GoalType } from "./stores/goalStore"
import { Frequency } from "./stores/settingsStore"

// In metres
const distance_data = {
    base: 10000, // m - the base goal (other goals scale from this)
    end_buffer: 300, // distance substracted from the length of the run (should not play audio after run finished) 
    // Different frequency settings
    // -> play audio every xxx metres
    intervals: {
        High: 750,
        Medium: 1500,
        Low: 3000
    }
}
// In minutes
const duration_data = {
    base: 60,
    end_buffer: 1.5,
    intervals: {
        High: 5,
        Medium: 10,
        Low: 20
    }
}

// Compute how often and how many times the coach will enter during the run
// Returns either timestamps or distances
export function entrancesDistribution(goal: number, goalType: GoalType, frequency: Frequency): number[] {
    const data = goalType === GoalType.Duration ? duration_data : distance_data
    const interval = data.intervals[frequency]

    const scaled_interval = interval * Math.sqrt(goal / data.base)
    const entranceCount = Math.max(2, Math.floor(goal / scaled_interval)) + 1

    const interval_between = (goal - data.end_buffer) / (entranceCount - 1)

    const intervals = []
    for (let i = 1; i < entranceCount; i++) {
        intervals.push(i * interval_between)
    }

    logger.info(`Entrance timestamps (${frequency}): ${intervals}`)
    return intervals
}

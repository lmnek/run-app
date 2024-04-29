import { GoalType } from "./stores/goalStore"
import { Frequency } from "./stores/settingsStore"

const distance_data = {
    base: 10000, // m
    end_buffer: 300,
    intervals: {
        High: 750,
        Medium: 1500,
        Low: 3000
    }
}

const duration_data = {
    base: 60, // min
    end_buffer: 1.5,
    intervals: {
        High: 5,
        Medium: 10,
        Low: 20
    }
}

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

    console.log(`Entrance timestamps (${frequency}): ${intervals}`)
    return intervals
}

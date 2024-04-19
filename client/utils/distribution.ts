
export enum GoalType { Duration = "Duration", Distance = "Distance" }

const distance_data = {
    base: 10000, // m
    end_buffer: 300,
    intervals: {
        high: 750,
        medium: 1500,
        low: 3000
    }
}

const duration_data = {
    base: 60, // min
    end_buffer: 2.5,
    intervals: {
        high: 5,
        medium: 10,
        low: 20
    }
}

export function entrancesDistribution(goal: number, goalType: GoalType, frequency: "high" | "medium" | "low"): number[] {
    const data = goalType === GoalType.Duration ? duration_data : distance_data
    const interval = data.intervals[frequency]

    const scaled_interval = interval * Math.sqrt(goal / data.base)
    const entranceCount = Math.max(2, Math.floor(goal / scaled_interval)) + 1

    const interval_between = (goal - data.end_buffer) / (entranceCount - 1)

    const intervals = []
    for (let i = 1; i < entranceCount; i++) {
        intervals.push(i * interval_between)
    }
    return intervals
}

export function getGoalDetails(goalType: GoalType) {
    if (goalType === GoalType.Duration) {
        return { unit: "min", name: "Time" }
    } else {
        return { unit: "km", name: "Distance" }
    }
}

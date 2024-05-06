import { relations } from 'drizzle-orm'
import { pgSchema, text, serial, integer, real, bigint } from 'drizzle-orm/pg-core'

export const mySchema = pgSchema('my_schema')

export const goals = mySchema.enum('goals', ['duration', 'distance'])

export const runs = mySchema.table('runs', {
    id: serial('id').primaryKey(),
    serial: integer('serial').notNull(),
    userId: text('user_id').notNull(),
    distance: integer('distance').notNull(),
    startTime: bigint('start_time', { mode: 'number' }).notNull(),
    endTime: bigint('end_time', { mode: 'number' }).notNull(),
    duration: integer('duration').notNull(),
    speed: real('speed').notNull(),
    topic: text('topic'),
    intent: text('intent')
})

export const positions = mySchema.table('positions', {
    id: serial('id').primaryKey(),
    runId: integer('run_id').notNull(),
    lat: real('lat').notNull(),
    long: real('long').notNull(),
    instantSpeed: real('instant_speed').notNull(),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull()
})

export const runsRelations = relations(runs, ({ many }) => ({
    positions: many(positions)
}))

export const positionsRelations = relations(positions, ({ one }) => ({
    user: one(runs, {
        fields: [positions.runId],
        references: [runs.id]
    })
}))

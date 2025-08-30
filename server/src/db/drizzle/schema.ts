import { relations } from 'drizzle-orm'
import { pgSchema, text, serial, integer, real, bigint } from 'drizzle-orm/pg-core'

// Schema definitions for the PostgreSQL
// defined with/for the Drizzle ORM
// Type definitions are automatically inferred from this file

export const mySchema = pgSchema('my_schema')

export const goals = mySchema.enum('goals', ['duration', 'distance'])

// Store a run
export const runs = mySchema.table('runs', {
    id: serial('id').primaryKey(),
    // Number of the run for a single user
    serial: integer('serial').notNull(),
    userId: text('user_id').notNull(),
    distance: real('distance').notNull(),
    startTime: bigint('start_time', { mode: 'number' }).notNull(),
    endTime: bigint('end_time', { mode: 'number' }).notNull(),
    duration: integer('duration').notNull(),
    speed: real('speed').notNull(),
    topic: text('topic'),
    intent: text('intent')
})

// Store a single GPS position/location
export const positions = mySchema.table('positions', {
    id: serial('id').primaryKey(),
    // Foreign key to the parent run table
    runId: serial('run_id')
        .references(() => runs.id, { onDelete: 'cascade' })
        .notNull(),
    lat: real('lat').notNull(),
    long: real('long').notNull(),
    alt: real('alt').notNull(),
    instantSpeed: real('instant_speed').notNull(),
    timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
    accuracy: real('accuracy')
})

// Create a connection between the two tables
// -> each run has multiple positions
// -> can use join querries with the ORM
export const runsRelations = relations(runs, ({ many }) => ({
    positions: many(positions)
}))
export const positionsRelations = relations(positions, ({ one }) => ({
    user: one(runs, {
        fields: [positions.runId],
        references: [runs.id]
    })
}))

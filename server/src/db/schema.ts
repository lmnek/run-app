import { pgSchema, text, serial, integer } from 'drizzle-orm/pg-core'

export const mySchema = pgSchema('my_schema')

export const goals = mySchema.enum('goals', ['duration', 'distance'])

export const runs = mySchema.table('runs', {
    id: serial('id').primaryKey(),
    serial: serial('serial'),
    userId: text('user_id'),
    time: text('time').notNull(),
    distance: integer('distance')
})

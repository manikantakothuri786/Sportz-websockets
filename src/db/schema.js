import { pgTable, pgEnum, serial, varchar, integer, timestamp, jsonb, text } from 'drizzle-orm/pg-core';

/**
 * Match Status Enum
 * Defines the possible states of a match:
 * - scheduled: Match is scheduled but not started yet
 * - live: Match is currently being played
 * - finished: Match has concluded
 */
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

/**
 * Matches Table
 * Stores comprehensive match information for the sports application
 *
 * Fields:
 * - id: Unique match identifier (auto-incrementing)
 * - sport: Type of sport (e.g., football, cricket, basketball)
 * - homeTeam: Name of the home team
 * - awayTeam: Name of the away team
 * - status: Current match status (scheduled, live, finished)
 * - startTime: When the match started
 * - endTime: When the match ended
 * - homeScore: Goals/points scored by home team (default: 0)
 * - awayScore: Goals/points scored by away team (default: 0)
 * - createdAt: Timestamp when the match record was created
 */
export const matchesTable = pgTable('matches', {
	id: serial('id').primaryKey(),
	sport: varchar('sport', { length: 50 }).notNull(),
	homeTeam: varchar('home_team', { length: 100 }).notNull(),
	awayTeam: varchar('away_team', { length: 100 }).notNull(),
	status: matchStatusEnum('status').default('scheduled').notNull(),
	startTime: timestamp('start_time'),
	endTime: timestamp('end_time'),
	homeScore: integer('home_score').default(0).notNull(),
	awayScore: integer('away_score').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Commentary Table
 * Stores real-time play-by-play commentary and events for matches
 *
 * Fields:
 * - id: Unique commentary identifier (auto-incrementing)
 * - matchId: Foreign key reference to the matches table
 * - minute: Minute/time in the match when the event occurred
 * - sequence: Event sequence number within a minute (for ordering simultaneous events)
 * - period: Match period (e.g., 1st half, 2nd half, overtime)
 * - eventType: Type of event (e.g., goal, substitution, foul, yellow_card, red_card)
 * - actor: Player name who performed the action
 * - team: Team name (home or away)
 * - message: Human-readable commentary message
 * - metadata: Additional event-specific data stored as JSON (e.g., video timestamp, ball possession, etc.)
 * - tags: Array of tags for categorizing events
 * - createdAt: Timestamp when the commentary was created
 */
export const commentaryTable = pgTable('commentary', {
	id: serial('id').primaryKey(),
	matchId: integer('match_id')
		.notNull()
		.references(() => matchesTable.id, { onDelete: 'cascade' }),
	minute: integer('minute').notNull(),
	sequence: integer('sequence').notNull(),
	period: varchar('period', { length: 50 }).notNull(),
	eventType: varchar('event_type', { length: 50 }).notNull(),
	actor: varchar('actor', { length: 100 }),
	team: varchar('team', { length: 100 }).notNull(),
	message: text('message').notNull(),
	metadata: jsonb('metadata'),
	tags: text('tags'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

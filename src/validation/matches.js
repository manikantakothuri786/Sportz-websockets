import { z } from 'zod';

/**
 * Match Status Constants
 * Defines the possible match status values in lowercase
 */
export const MATCH_STATUS = {
	SCHEDULED: 'scheduled',
	LIVE: 'live',
	FINISHED: 'finished',
};

/**
 * List Matches Query Schema
 * Validates optional query parameters for fetching multiple matches
 *
 * Fields:
 * - limit: Optional positive integer with maximum of 100 (coerced)
 */
export const listMatchesQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Match ID Parameter Schema
 * Validates required id parameter from URL
 *
 * Fields:
 * - id: Required positive integer (coerced)
 */
export const matchIdParamSchema = z.object({
	id: z.coerce.number().int().positive(),
});

/**
 * Create Match Schema
 * Validates data required to create a new match
 *
 * Fields:
 * - sport: Non-empty string
 * - homeTeam: Non-empty string
 * - awayTeam: Non-empty string
 * - startTime: ISO 8601 date string
 * - endTime: ISO 8601 date string (must be after startTime)
 * - homeScore: Optional non-negative integer (defaults to 0)
 * - awayScore: Optional non-negative integer (defaults to 0)
 *
 * Refinements:
 * - endTime must be chronologically after startTime
 * - Both startTime and endTime must be valid ISO 8601 date strings
 */
export const createMatchSchema = z.object({
	sport: z.string().trim().min(1, 'Sport is required'),
	homeTeam: z.string().trim().min(1, 'Home team is required'),
	awayTeam: z.string().trim().min(1, 'Away team is required'),
	startTime: z.string().refine(
		(date) => !isNaN(Date.parse(date)),
		'Start time must be a valid ISO 8601 date string'
	),
	endTime: z.string().refine(
		(date) => !isNaN(Date.parse(date)),
		'End time must be a valid ISO 8601 date string'
	),
	homeScore: z.coerce.number().int().nonnegative().optional(),
	awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
	const startTimeDate = new Date(data.startTime);
	const endTimeDate = new Date(data.endTime);

	if (endTimeDate <= startTimeDate) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['endTime'],
			message: 'End time must be chronologically after start time',
		});
	}
});

/**
 * Update Score Schema
 * Validates data required to update match scores
 *
 * Fields:
 * - homeScore: Required non-negative integer (coerced)
 * - awayScore: Required non-negative integer (coerced)
 */
export const updateScoreSchema = z.object({
	homeScore: z.coerce.number().int().nonnegative(),
	awayScore: z.coerce.number().int().nonnegative(),
});


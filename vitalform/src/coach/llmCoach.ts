import { generateCoachAnswer, type CoachContext, type CoachResponse } from './coachEngine';

export async function queryAuraCoach(userQuery: string, context: CoachContext): Promise<CoachResponse> {
  return generateCoachAnswer(userQuery, context);
}

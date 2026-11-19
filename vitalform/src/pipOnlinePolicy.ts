export const pipQuestionLimit = 350;

const privateTopics = /\b(?:health|medical|medicine|medication|disease|treatment|diagnos\w*|dosage\w*|dose\w*|symptom\w*|allerg\w*|pain\w*|fever|injur\w*|pregnan\w*|diabet\w*|blood|skin\w*|acne|food|diet|meal\w*|dinner|recipe\w*|fitness|workout\w*|exercise\w*|squat\w*|lunge\w*|knee\w*|hydrat\w*|water|protein|calori\w*|elder\w*|senior\w*|weather|season|profile|weight|height|age|address|password|phone|email|name)\b/i;
const siteTopics = /\b(?:app|website|javascript|typescript|canvas|vite|react|animation|tech(?:nology)?|design|code|interface|css|html|browser|accessibility|privacy|performance|universes?|synth|audio|project|pip(?:\.exe)?)\b/i;

export function pipOnlineEligible(question: string) {
  return question.trim().length <= pipQuestionLimit && !privateTopics.test(question) && !/[@\r\n]/.test(question) && siteTopics.test(question);
}

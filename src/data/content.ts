import axesJson from "./axes.json";
import peopleJson from "./people.json";
import questionsJson from "./questions.json";
import { axesSchema, peopleSchema, questionsSchema } from "./schema";

export const axes = axesSchema.parse(axesJson);
export const people = peopleSchema.parse(peopleJson);
export const questions = questionsSchema.parse(questionsJson);

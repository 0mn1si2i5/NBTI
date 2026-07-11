import { z } from "zod";

export const axisKeys = ["tui_jin", "po_li", "xu_shi", "kuang_zhi", "qi_zheng", "rou_gang"] as const;
export const axisKeySchema = z.enum(axisKeys);

const scoreSchema = z.number().min(-2).max(2);
const deltaValueSchema = z.number().int().min(-2).max(2).refine((value) => value !== 0, "delta cannot be zero");

export const axisDeltaSchema = z
  .object({
    tui_jin: deltaValueSchema.optional(),
    po_li: deltaValueSchema.optional(),
    xu_shi: deltaValueSchema.optional(),
    kuang_zhi: deltaValueSchema.optional(),
    qi_zheng: deltaValueSchema.optional(),
    rou_gang: deltaValueSchema.optional(),
  })
  .strict();

export const axisMetaSchema = z.object({
  key: axisKeySchema,
  label: z.string().min(1),
  left: z.string().min(1),
  right: z.string().min(1),
  weight: z.number().positive(),
});

export const axesSchema = z.array(axisMetaSchema).length(axisKeys.length);

export const vectorSchema = z.tuple([
  scoreSchema,
  scoreSchema,
  scoreSchema,
  scoreSchema,
  scoreSchema,
  scoreSchema,
]);

const sourceReferenceSchema = z.object({
  sourceTitle: z.string().min(1),
  sourceUrl: z.url(),
  locator: z.string().min(1),
});

export const quoteSchema = sourceReferenceSchema.extend({
  text: z.string().min(1),
});

export const historicalFactSchema = sourceReferenceSchema.extend({
  text: z.string().min(1),
  sourceKind: z.enum(["primary", "secondary"]),
});

export const personSchema = z.object({
  id: z.string().min(1),
  person: z.string().min(1),
  title: z.string().trim().min(2).max(12),
  quote: quoteSchema,
  why: z.string().min(1),
  vector: vectorSchema,
  facts: z.array(historicalFactSchema).min(2).max(3),
  avatar: z.string().regex(/^assets\/characters\/[\w-]+\.webp$/),
});

export const peopleSchema = z.array(personSchema).length(32);

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1),
  delta: axisDeltaSchema,
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["scenario", "likert"]),
    text: z.string().min(1),
    design: z.object({
      primaryAxis: axisKeySchema,
      secondaryAxis: axisKeySchema.optional(),
      distinguishes: z.array(z.string()).max(6),
      keying: z.enum(["positive", "negative"]).optional(),
    }),
    options: z.array(questionOptionSchema).min(4).max(5),
  })
  .superRefine((question, context) => {
    if (question.type === "scenario" && question.options.length !== 4) {
      context.addIssue({ code: "custom", message: "scenario question requires four options", path: ["options"] });
    }
    if (question.type === "scenario" && question.design.keying) {
      context.addIssue({ code: "custom", message: "scenario question cannot define keying", path: ["design", "keying"] });
    }
    if (question.type === "likert" && question.options.length !== 5) {
      context.addIssue({ code: "custom", message: "likert question requires five options", path: ["options"] });
    }
    if (question.type === "likert" && question.design.secondaryAxis) {
      context.addIssue({ code: "custom", message: "likert question cannot define secondaryAxis", path: ["design", "secondaryAxis"] });
    }
    if (question.type === "likert" && !question.design.keying) {
      context.addIssue({ code: "custom", message: "likert question requires keying", path: ["design", "keying"] });
    }
  });

export const questionsSchema = z.array(questionSchema).length(24);

export type AxisKey = z.infer<typeof axisKeySchema>;
export type AxisDelta = z.infer<typeof axisDeltaSchema>;
export type AxisMeta = z.infer<typeof axisMetaSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type HistoricalFact = z.infer<typeof historicalFactSchema>;
export type Person = z.infer<typeof personSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type Question = z.infer<typeof questionSchema>;

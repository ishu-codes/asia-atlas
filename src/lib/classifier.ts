import { z } from "zod";

/**
 * TypeScript port of classification/classifier.py.
 *
 * The classifier is a small HTTP service that answers one or more typed
 * questions about a piece of text. We use it offline to assign an occupational
 * category to each person; the app itself never calls it at request time.
 */

export const CLASSIFICATION_URL =
  "https://simple-jev-demo-api.featherless.ai/v1/classifier";
export const CLASSIFICATION_MODEL = "featherless-ai/gemma-4-26B-A4B-classifier";

export type ChoiceQuestion = {
  type: "choice";
  name: string;
  instructions: string;
  criteria: Record<string, unknown>;
};

export type ScoreQuestion = {
  type: "score";
  name: string;
  instructions: string;
  criteria: string[];
};

export type NoulQuestion = {
  type: "noul";
  name: string;
  instructions: string;
  criteria?: { true: unknown; false: unknown } | null;
};

export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

const choiceAnswerSchema = z.object({
  type: z.literal("choice"),
  choice: z.string(),
  confidence: z.number(),
  probabilities: z.record(z.string(), z.number()),
});

const scoreAnswerSchema = z.object({
  type: z.literal("score"),
  confidence: z.number(),
  probabilities: z.record(z.string(), z.number()),
  score: z.number(),
  legend: z.record(z.string(), z.string()),
});

const noulAnswerSchema = z.object({
  type: z.literal("noul"),
  noul: z.number(),
});

const answerSchema = z.discriminatedUnion("type", [
  choiceAnswerSchema,
  scoreAnswerSchema,
  noulAnswerSchema,
]);

const responseSchema = z.object({
  answers: z.record(z.string(), answerSchema),
});

export type ChoiceAnswer = z.infer<typeof choiceAnswerSchema>;
export type ScoreAnswer = z.infer<typeof scoreAnswerSchema>;
export type NoulAnswer = z.infer<typeof noulAnswerSchema>;
export type Answer = z.infer<typeof answerSchema>;

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class Classifier {
  private readonly model: string;
  private readonly endpoint: string;

  constructor(
    model: string = CLASSIFICATION_MODEL,
    endpoint: string = CLASSIFICATION_URL,
  ) {
    this.model = model;
    this.endpoint = endpoint;
  }

  async classify(
    state: string,
    questions: readonly Question[],
  ): Promise<Record<string, Answer>> {
    const allQuestions = this.combineQuestions(questions);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      let response: Response;

      try {
        response = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            state,
            questions: allQuestions,
          }),
          signal: AbortSignal.timeout(30_000),
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < 5) {
          await sleep(Math.min(2 ** attempt, 20) * 1000);
        }
        continue;
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(
          `Classifier request failed with status ${response.status}`,
        );
        if (attempt < 5) {
          await sleep(Math.min(2 ** attempt, 20) * 1000);
        }
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Classifier request failed with status ${response.status}: ${await response.text()}`,
        );
      }

      const json: unknown = await response.json();
      const parsed = responseSchema.safeParse(json);

      if (!parsed.success) {
        throw new Error(
          `Unexpected classifier response: ${parsed.error.message}`,
        );
      }

      return this.combineAnswers(parsed.data.answers);
    }

    throw (
      lastError ?? new Error("Classifier request failed without a response.")
    );
  }

  private combineQuestions(
    questions: readonly Question[],
  ): Record<string, unknown> {
    return Object.fromEntries(
      questions.map((question) => {
        const { name, ...rest } = question;
        return [name, { ...rest, type: question.type }];
      }),
    );
  }

  private combineAnswers(
    answers: Record<string, Answer>,
  ): Record<string, Answer> {
    const combined: Record<string, Answer> = {};

    for (const [name, answer] of Object.entries(answers)) {
      if (answer.type === "score") {
        const probabilities: Record<string, number> = {};
        for (const [key, probability] of Object.entries(answer.probabilities)) {
          probabilities[answer.legend[key] ?? key] = probability;
        }
        combined[name] = { ...answer, probabilities };
      } else {
        combined[name] = answer;
      }
    }

    return combined;
  }
}

export const classifier = new Classifier();

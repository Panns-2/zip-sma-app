
'use server';

/**
 * @fileOverview AI flows to assist students with their learning.
 */

import { ai, googleAI } from '@/ai/genkit';
import { z } from 'zod';

// 1. Homework Helper
const ExplainConceptInputSchema = z.object({
  question: z.string().describe('The homework question or concept the student needs help with.'),
  className: z.string().describe("The student's class level, e.g., 'Primary 4'."),
});
export type ExplainConceptInput = z.infer<typeof ExplainConceptInputSchema>;

const ExplainConceptOutputSchema = z.object({
  explanation: z.string().describe('A simple explanation, hint, or breakdown of the concept.'),
});
export type ExplainConceptOutput = z.infer<typeof ExplainConceptOutputSchema>;

export async function explainConcept(input: ExplainConceptInput): Promise<ExplainConceptOutput> {
  return explainConceptFlow(input);
}

const explainConceptPrompt = ai.definePrompt({
    name: 'explainConceptPrompt',
    input: { schema: ExplainConceptInputSchema },
    output: { schema: ExplainConceptOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a friendly and encouraging tutor. A student from class "{{className}}" has asked for help with a question or concept: "{{question}}". 
    
    Your task is to provide a simple, age-appropriate explanation, hint, or a breakdown of the steps to solve it. 
    DO NOT give the final answer directly. Your goal is to guide the student to figure it out themselves.
    Keep your explanation concise and targeted at a student in {{className}}.`,
});


const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    const { output } = await explainConceptPrompt(input);
    return output!;
  }
);


// 2. Revision Assistant
const SummarizeTopicInputSchema = z.object({
  topic: z.string().describe('The topic or subject the student wants a summary of.'),
});
export type SummarizeTopicInput = z.infer<typeof SummarizeTopicInputSchema>;

const SummarizeTopicOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key points for the given topic, formatted in markdown.'),
});
export type SummarizeTopicOutput = z.infer<typeof SummarizeTopicOutputSchema>;

export async function summarizeTopic(input: SummarizeTopicInput): Promise<SummarizeTopicOutput> {
  return summarizeTopicFlow(input);
}

const summarizeTopicPrompt = ai.definePrompt({
    name: 'summarizeTopicPrompt',
    input: { schema: SummarizeTopicInputSchema },
    output: { schema: SummarizeTopicOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a helpful study assistant. A student needs a revision summary for the topic: "{{topic}}".
    
    Please generate a concise summary of the most important key points for this topic.
    - Use bullet points or short paragraphs.
    - Focus on the core concepts a student would need to know for a test.
    - The output should be in simple markdown format.`,
});

const summarizeTopicFlow = ai.defineFlow(
  {
    name: 'summarizeTopicFlow',
    inputSchema: SummarizeTopicInputSchema,
    outputSchema: SummarizeTopicOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeTopicPrompt(input);
    return output!;
  }
);


// 3. AI Quiz Generator
const QuizGeneratorInputSchema = z.object({
    topic: z.string().describe('The topic or subject for the quiz.'),
});
export type QuizGeneratorInput = z.infer<typeof QuizGeneratorInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).describe('A list of 4 possible answers (multiple choice).'),
    answer: z.string().describe('The correct answer from the options list.'),
});

const QuizGeneratorOutputSchema = z.object({
    questions: z.array(QuizQuestionSchema).describe('A list of 3-5 multiple choice questions.'),
});
export type QuizGeneratorOutput = z.infer<typeof QuizGeneratorOutputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export async function generateQuiz(input: QuizGeneratorInput): Promise<QuizGeneratorOutput> {
    return quizGeneratorFlow(input);
}

const quizGeneratorPrompt = ai.definePrompt({
    name: 'quizGeneratorPrompt',
    input: { schema: QuizGeneratorInputSchema },
    output: { schema: QuizGeneratorOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are an AI that creates educational quizzes. A student wants a short quiz on the topic: "{{topic}}".
    
    Please generate 4 multiple-choice questions based on this topic.
    - Each question must have exactly 4 options.
    - One of the options must be the correct answer.
    - The questions should be suitable for a student and test their basic understanding of the topic.`,
});

const quizGeneratorFlow = ai.defineFlow(
    {
        name: 'quizGeneratorFlow',
        inputSchema: QuizGeneratorInputSchema,
        outputSchema: QuizGeneratorOutputSchema,
    },
    async (input) => {
        const { output } = await quizGeneratorPrompt(input);
        return output!;
    }
);

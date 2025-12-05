
'use server';

/**
 * @fileOverview A collection of AI flows to assist teachers.
 */

import { ai, googleAI } from '@/ai/genkit';
import { z } from 'zod';

// 1. Lesson Planning Support
const LessonPlanInputSchema = z.object({
  subject: z.string().describe('The subject for the lesson plan, e.g., "Science"'),
  classLevel: z.string().describe('The class level for the lesson, e.g., "Primary 4"'),
  topic: z.string().describe('The specific topic for the lesson, e.g., "Photosynthesis"'),
});
export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>;

const LessonPlanOutputSchema = z.object({
  objectives: z.array(z.string()).describe('A list of 3-4 clear, concise learning objectives.'),
  materials: z.array(z.string()).describe('A list of materials needed for the lesson.'),
  activities: z.array(z.object({
    activity: z.string().describe('Name of the activity, e.g., "Introduction", "Group Work", "Conclusion".'),
    description: z.string().describe('A brief description of the activity.'),
  })).describe('A sequence of lesson activities.'),
});
export type LessonPlan = z.infer<typeof LessonPlanOutputSchema>;

export async function generateLessonPlan(input: LessonPlanInput): Promise<LessonPlan> {
  return lessonPlanFlow(input);
}

const lessonPlanPrompt = ai.definePrompt({
    name: 'lessonPlanPrompt',
    input: { schema: LessonPlanInputSchema },
    output: { schema: LessonPlanOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a curriculum expert in a Ghanaian school. Create a simple but effective lesson plan outline for the subject "{{subject}}", focusing on the topic "{{topic}}" for class level "{{classLevel}}". Provide 3-4 learning objectives, a list of materials, and a sequence of key activities. Be concise and practical for a teacher.`,
});


const lessonPlanFlow = ai.defineFlow(
  {
    name: 'lessonPlanFlow',
    inputSchema: LessonPlanInputSchema,
    outputSchema: LessonPlanOutputSchema,
  },
  async (input) => {
    const { output } = await lessonPlanPrompt(input);
    return output!;
  }
);


// 2. Assessment & Grading
const AssessmentInputSchema = z.object({
  topic: z.string().describe('The topic or subject area for which to generate assessment ideas, e.g., "The Water Cycle"'),
});
export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;

const AssessmentOutputSchema = z.object({
  ideas: z.array(z.object({
    type: z.string().describe('The type of assessment, e.g., "Quiz", "Project", "Classwork", "Group Activity".'),
    description: z.string().describe('A brief description of the assessment idea.'),
  })).describe('A list of 3-4 diverse assessment ideas.'),
});
export type AssessmentIdeas = z.infer<typeof AssessmentOutputSchema>;

export async function generateAssessmentIdeas(input: AssessmentInput): Promise<AssessmentIdeas> {
  return assessmentFlow(input);
}

const assessmentPrompt = ai.definePrompt({
    name: 'assessmentPrompt',
    input: { schema: AssessmentInputSchema },
    output: { schema: AssessmentOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are an experienced teacher. Provide 3-4 creative and practical assessment ideas for the topic "{{topic}}". Include a mix of individual and group work, such as quizzes, projects, or in-class activities.`,
});

const assessmentFlow = ai.defineFlow(
  {
    name: 'assessmentFlow',
    inputSchema: AssessmentInputSchema,
    outputSchema: AssessmentOutputSchema,
  },
  async (input) => {
    const { output } = await assessmentPrompt(input);
    return output!;
  }
);


// 3. Report & Remark Generation
const ReportRemarkInputSchema = z.object({
  performance: z.string().describe('The student\'s performance level, e.g., "Excellent", "Good", "Average", "Needs Improvement".'),
});
export type ReportRemarkInput = z.infer<typeof ReportRemarkInputSchema>;

const ReportRemarkOutputSchema = z.object({
  remarks: z.array(z.string()).describe('A list of 2-3 alternative, constructive remarks for a report card based on the performance level.'),
});
export type ReportRemark = z.infer<typeof ReportRemarkOutputSchema>;

export async function generateReportRemark(input: ReportRemarkInput): Promise<ReportRemark> {
  return reportRemarkFlow(input);
}

const reportRemarkPrompt = ai.definePrompt({
    name: 'reportRemarkPrompt',
    input: { schema: ReportRemarkInputSchema },
    output: { schema: ReportRemarkOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a caring and professional teacher. Generate 2-3 alternative report card remarks for a student whose performance is described as "{{performance}}". The remarks should be constructive, encouraging, and professional.`,
});

const reportRemarkFlow = ai.defineFlow(
  {
    name: 'reportRemarkFlow',
    inputSchema: ReportRemarkInputSchema,
    outputSchema: ReportRemarkOutputSchema,
  },
  async (input) => {
    const { output } = await reportRemarkPrompt(input);
    return output!;
  }
);


// 4. Teaching & Classroom Support
const ManagementInputSchema = z.object({
  issue: z.string().describe('A description of a classroom management issue, e.g., "Students are too noisy during group work."'),
});
export type ManagementInput = z.infer<typeof ManagementInputSchema>;

const ManagementOutputSchema = z.object({
    solutions: z.array(z.object({
        strategy: z.string().describe('The name of the suggested strategy.'),
        explanation: z.string().describe('A brief, actionable explanation of how to implement the strategy.'),
    })).describe('A list of 2-3 practical solutions for the described issue.'),
});
export type ManagementSolution = z.infer<typeof ManagementOutputSchema>;

export async function generateManagementSolution(input: ManagementInput): Promise<ManagementSolution> {
    return managementSolutionFlow(input);
}

const managementSolutionPrompt = ai.definePrompt({
    name: 'managementSolutionPrompt',
    input: { schema: ManagementInputSchema },
    output: { schema: ManagementOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are an expert in classroom management. A teacher is facing the following issue: "{{issue}}". Provide 2-3 practical, actionable strategies to address this problem.`,
});

const managementSolutionFlow = ai.defineFlow(
    {
        name: 'managementSolutionFlow',
        inputSchema: ManagementInputSchema,
        outputSchema: ManagementOutputSchema,
    },
    async (input) => {
        const { output } = await managementSolutionPrompt(input);
        return output!;
    }
);

// 5. Curriculum Resource Generator
const WritingPromptInputSchema = z.object({
  topic: z.string().describe('The topic or subject for the writing prompts, e.g., "My Favorite Holiday"'),
  classLevel: z.string().describe('The class level for the prompts, e.g., "Primary 2"'),
  resourceType: z.string().describe('The type of resource to generate, e.g., "Worksheet", "Reading Material"'),
});
export type WritingPromptInput = z.infer<typeof WritingPromptInputSchema>;

const WritingPromptOutputSchema = z.object({
  prompts: z.array(z.string()).describe('A list of 3-4 creative and engaging writing prompts or resource content suitable for the specified topic and class level.'),
});
export type WritingPrompts = z.infer<typeof WritingPromptOutputSchema>;

export async function generateWritingPrompts(input: WritingPromptInput): Promise<WritingPrompts> {
  return writingPromptFlow(input);
}

const writingPromptPrompt = ai.definePrompt({
    name: 'writingPromptPrompt',
    input: { schema: WritingPromptInputSchema },
    output: { schema: WritingPromptOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a creative writing teacher in Ghana. Generate 3-4 engaging and age-appropriate resources for a "{{classLevel}}" class on the topic of "{{topic}}". The resource type is {{resourceType}}. The prompts should spark imagination.`,
});


const writingPromptFlow = ai.defineFlow(
  {
    name: 'writingPromptFlow',
    inputSchema: WritingPromptInputSchema,
    outputSchema: WritingPromptOutputSchema,
  },
  async (input) => {
    const { output } = await writingPromptPrompt(input);
    return output!;
  }
);


// 6. Student Support & Differentiation
const DiffInstructionInputSchema = z.object({
  lessonTopic: z.string().describe('The topic of the lesson, e.g., "Fractions"'),
  objective: z.string().describe('The main learning objective for the lesson.'),
});
export type DiffInstructionInput = z.infer<typeof DiffInstructionInputSchema>;

const DiffInstructionOutputSchema = z.object({
  strugglingLearners: z.array(z.object({
    activity: z.string().describe('Name of the simplified activity or support strategy.'),
    description: z.string().describe('How this activity helps learners who are struggling.'),
  })).describe('A list of 2-3 ideas for students who need extra support.'),
  advancedLearners: z.array(z.object({
    activity: z.string().describe('Name of the extension or challenge activity.'),
    description: z.string().describe('How this activity challenges advanced learners.'),
  })).describe('A list of 2-3 ideas for students who need an extra challenge.'),
});
export type DifferentiatedInstruction = z.infer<typeof DiffInstructionOutputSchema>;

export async function generateDifferentiatedInstruction(input: DiffInstructionInput): Promise<DifferentiatedInstruction> {
  return diffInstructionFlow(input);
}

const diffInstructionPrompt = ai.definePrompt({
    name: 'diffInstructionPrompt',
    input: { schema: DiffInstructionInputSchema },
    output: { schema: DiffInstructionOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are an instructional coach specializing in differentiation. For a lesson on "{{lessonTopic}}" with the objective "{{objective}}", provide 2-3 distinct activity ideas for struggling learners and 2-3 extension activities for advanced learners.`,
});

const diffInstructionFlow = ai.defineFlow(
  {
    name: 'diffInstructionFlow',
    inputSchema: DiffInstructionInputSchema,
    outputSchema: DiffInstructionOutputSchema,
  },
  async (input) => {
    const { output } = await diffInstructionPrompt(input);
    return output!;
  }
);

// 7. Communication & Engagement
const ParentCommunicationInputSchema = z.object({
    studentName: z.string().describe('The name of the student.'),
    performanceSummary: z.string().describe('A brief summary of the student\'s positive performance.'),
    areasForImprovement: z.string().describe('A brief summary of areas where the student can improve.'),
});
export type ParentCommunicationInput = z.infer<typeof ParentCommunicationInputSchema>;

const ParentCommunicationOutputSchema = z.object({
    message: z.string().describe('A friendly, professional, and constructive message for the parent.'),
});
export type ParentCommunicationOutput = z.infer<typeof ParentCommunicationOutputSchema>;

export async function generateParentCommunication(input: ParentCommunicationInput): Promise<ParentCommunicationOutput> {
    return parentCommunicationFlow(input);
}

const parentCommunicationPrompt = ai.definePrompt({
    name: 'parentCommunicationPrompt',
    input: { schema: ParentCommunicationInputSchema },
    output: { schema: ParentCommunicationOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a teacher composing a message to a parent. Be friendly and professional.
    
    Student's Name: {{studentName}}
    Positive Performance: {{performanceSummary}}
    Areas for Improvement: {{areasForImprovement}}
    
    Based on the points above, draft a concise and encouraging message to the parent of {{studentName}}. Start with a positive note, then gently introduce the areas for improvement, and end with a collaborative tone.`,
});


const parentCommunicationFlow = ai.defineFlow(
    {
        name: 'parentCommunicationFlow',
        inputSchema: ParentCommunicationInputSchema,
        outputSchema: ParentCommunicationOutputSchema,
    },
    async (input) => {
        const { output } = await parentCommunicationPrompt(input);
        return output!;
    }
);


// 8. Professional Development
const ResourceRecommendationInputSchema = z.object({
    topic: z.string().describe('The teaching topic or skill the user wants to develop, e.g., "Classroom Management"'),
    desiredOutcome: z.string().describe('What the user hopes to achieve, e.g., "Find new strategies for engagement."'),
});
export type ResourceRecommendationInput = z.infer<typeof ResourceRecommendationInputSchema>;

const ResourceRecommendationOutputSchema = z.object({
    recommendations: z.array(z.object({
        type: z.string().describe('The type of resource, e.g., "Article", "Video", "Webinar", "Online Course".'),
        title: z.string().describe('The title of the resource.'),
        link: z.string().describe('A plausible example URL for the resource. Do not use real or active links.'),
        description: z.string().describe('A brief summary of why this resource is useful.'),
    })).describe('A list of 2-3 resource recommendations.'),
});
export type ResourceRecommendation = z.infer<typeof ResourceRecommendationOutputSchema>;

export async function generateResourceRecommendation(input: ResourceRecommendationInput): Promise<ResourceRecommendation> {
    return resourceRecommendationFlow(input);
}

const resourceRecommendationPrompt = ai.definePrompt({
    name: 'resourceRecommendationPrompt',
    input: { schema: ResourceRecommendationInputSchema },
    output: { schema: ResourceRecommendationOutputSchema },
    model: googleAI.model('gemini-flash-latest'),
    prompt: `You are a professional development coach for teachers. A teacher is interested in the topic "{{topic}}" to help them "{{desiredOutcome}}".
    
    Provide 2-3 recommendations for high-quality professional development resources. For each, include a type (e.g., Article, Video), a title, a plausible example link (do not use real URLs), and a short description.`,
});

const resourceRecommendationFlow = ai.defineFlow(
    {
        name: 'resourceRecommendationFlow',
        inputSchema: ResourceRecommendationInputSchema,
        outputSchema: ResourceRecommendationOutputSchema,
    },
    async (input) => {
        const { output } = await resourceRecommendationPrompt(input);
        return output!;
    }
);

export interface MockGoal {
  id: string;
  title: string;
  baseline: number;
  target: number;
  latestScore: number;
  progressPct: number;
}

export const mockGoals: MockGoal[] = [
  {
    id: "1",
    title: "Reading Comprehension",
    baseline: 45,
    target: 80,
    latestScore: 72,
    progressPct: Math.round(((72 - 45) / (80 - 45)) * 100),
  },
  {
    id: "2",
    title: "Math Problem Solving",
    baseline: 52,
    target: 75,
    latestScore: 65,
    progressPct: Math.round(((65 - 52) / (75 - 52)) * 100),
  },
  {
    id: "3",
    title: "Written Expression",
    baseline: 38,
    target: 70,
    latestScore: 50,
    progressPct: Math.round(((50 - 38) / (70 - 38)) * 100),
  },
];

export const mockParentSummary = `Dear Parent or Guardian,

We are pleased to share a summary of your child's current progress and educational plan.

Your child is making meaningful progress in reading and math. Our team has been working on building comprehension skills and number sense, and we have seen growth in both areas this semester.

In reading, your child is working toward their annual goal and is currently about 77% of the way there. In math, they have made strong progress in problem-solving. Written expression is an area where we continue to provide focused support.

Your child receives small-group instruction and in-classroom support. We meet regularly to review progress and make adjustments as needed.

We have an annual review coming up and will send you an invitation to attend. Please don't hesitate to reach out with any questions.

Sincerely,
The EveryLearner Team`;

import { WorkflowAI } from "@workflowai/workflowai";

export const workflowAI = new WorkflowAI({
  key: process.env.WORKFLOWAI_API_KEY,
}); 
require('dotenv').config({ path: '.env.local' });
const { WorkflowAI } = require("@workflowai/workflowai");

const workflowAI = new WorkflowAI({
  key: process.env.WORKFLOWAI_API_KEY,
});

const playlistPromptAgent = workflowAI.agent({
  id: "playlist-prompt-generation",
  schemaId: 3,
  version: "6.1",
  useCache: "auto",
});

async function testWorkflowAI() {
  try {
    console.log("🔍 Testing WorkflowAI...");
    console.log("🔍 API Key:", process.env.WORKFLOWAI_API_KEY ? "Present" : "Missing");
    
    const input = {
      category_selections: [
        {
          category: "genre",
          selection: "rock"
        },
        {
          category: "mood",
          selection: "energetic"
        }
      ],
      custom_text: "for working out"
    };
    
    console.log("🔍 Input:", JSON.stringify(input, null, 2));
    
    const result = await playlistPromptAgent(input);
    console.log("🔍 Result:", JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testWorkflowAI();

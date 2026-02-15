const { GoogleGenerativeAI } = require("@google/generative-ai");

// 12 AKTU B.Tech Program Outcomes with full descriptions
const AKTU_POS = {
  PO1: "Engineering Knowledge: Apply knowledge of mathematics, science and engineering.",
  PO2: "Problem Analysis: Identify, formulate and review literature to analyse engineering problems using basic principles of science and mathematics.",
  PO3: "Design/Development of Solutions: An ability to design a system, component or process to meet desired needs within realistic constraints such as economic, environmental, social political, ethical, health and safety, manufacturing and sustainability.",
  PO4: "Conduct Investigations of Complex Problems: An ability to design and conduct experiment as well as to analyse and interpret data.",
  PO5: "Modern Tool Usage: Use of techniques, skills and modern engineering tools necessary for engineering practice.",
  PO6: "The Engineer and Society: Understand their responsibilities and duties towards society, health, safety, legal and cultural issue and adopt them in professional engineering practice.",
  PO7: "Environment and Sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.",
  PO8: "Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.",
  PO9: "Individual and Team Work: An ability to function effectively as an individual and as a member or leader on multidisciplinary team with high team spirit.",
  PO10: "Communication: Ability to design, documentation, write effective report, make effective presentations to the engineering community and society at large.",
  PO11: "Project Management and Finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.",
  PO12: "Life-Long Learning: Ability to engage in independent and lifelong learning in the broad context of technology change & advancement.",
};

/**
 * Generate CO-PO mapping using Google Gemini AI
 * @param {string[]} courseOutcomes - Array of CO descriptions
 * @returns {Object} Mapping JSON e.g. { "CO1": { "PO1": 3, "PO2": 2 }, ... }
 */
async function generateCOPOMapping(courseOutcomes) {
  console.log("Gemini Service: Starting generation for", courseOutcomes.length, "COs");
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("Gemini Service Error: API Key is missing or default placeholder");
    throw new Error("GEMINI_API_KEY is not configured. Please add it to .env and RESTART the backend server.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash as it is the authorized model for this key in 2026
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const coList = courseOutcomes.map((co, i) => `CO${i + 1}: ${co}`).join("\n");
  const poList = Object.entries(AKTU_POS).map(([code, desc]) => `${code}: ${desc}`).join("\n");

  const prompt = `You are an expert in Outcome-Based Education (OBE) for engineering programs under AKTU.
Given the following Course Outcomes (COs) and Program Outcomes (POs), generate a CO-PO mapping matrix.

**Course Outcomes:**
${coList}

**Program Outcomes:**
${poList}

**Rules:**
- Levels: 1 (Low), 2 (Medium), 3 (High).
- Only map if there is clear alignment.
- Return ONLY valid JSON in this format: { "CO1": { "PO1": 3 }, "CO2": {} }

Return ONLY the JSON.`;

  try {
    console.log("Gemini Service: Calling Google AI API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    
    console.log("Gemini Service: AI Response received");

    const mapping = JSON.parse(text);
    return mapping;
  } catch (error) {
    console.error("Gemini Service API/Parse Error:", error);
    throw new Error(`Gemini AI Error: ${error.message}`);
  }
}

module.exports = {
  generateCOPOMapping,
  AKTU_POS,
};

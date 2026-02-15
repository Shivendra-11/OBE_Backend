require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("API Key missing in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-lite-preview-0205", // Example of a newer one
    "gemini-pro"
  ];

  console.log("Starting model check...");

  for (const modelName of models) {
    try {
      process.stdout.write(`Checking ${modelName}... `);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("echo 'ok'");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS! Response: ${text.substring(0, 20)}...`);
      console.log(`\n>>> USE THIS MODEL: ${modelName}\n`);
      return; // Stop at first success
    } catch (e) {
      console.log(`❌ FAILED: ${e.message.substring(0, 100)}...`);
      if (e.message.includes("429")) {
          console.log("   (Quota exceeded - usually means limit reached or restricted)");
      }
    }
  }
}

checkModels();

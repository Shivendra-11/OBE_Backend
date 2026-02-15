require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.includes("AIzaSyB")) {
    // If it looks like a real key, use it. The user added one in .env.
    // I previously saw AIzaSyBIsr8s2w_apJNTYOxHe2Vjyn70Vjq1nkw in .env.
  } else {
    console.error("API Key missing or invalid in .env");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log("Fetching authorized models from Google API...");
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
        console.error(`Error ${response.status}:`, data);
        return;
    }

    const models = data.models;
    
    console.log("\n--- AUTHORIZED MODELS ---");
    if (models) {
        models.forEach(m => {
          console.log(`- ${m.name.replace('models/', '')} (Supported: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } else {
        console.log("⚠️ No models found in response.");
    }
    console.log("-------------------------\n");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();

// write a script that tests the companyNameValidatorAgent

import { companyNameValidatorAgent } from "../src";

(async () => {
  const companyNames = [
    //"Apple",
    // "Apple 1 2 3",
    // "Google",
    // "Google 1 2 3",
    // "Microsoft",
    "The Pinnacle",
    // "The Pinnacle 1 2 3",
    // "The Pinnacle!",
  ];

  for (const companyName of companyNames) {
    try {
      console.log(`Testing company name: "${companyName}"`);
      const result = await companyNameValidatorAgent(companyName);
      console.log("Result:", result);

      if (result === null) {
        console.log("Warning: Agent returned null");
      }
    } catch (error) {
      console.error("Error processing company name:", error);
    }
  }
})();

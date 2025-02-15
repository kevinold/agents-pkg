// write a script that tests the companyNameValidatorAgent

import { companyNameValidatorAgent } from "../src";

(async () => {
  const companyNames = [
    // "Apple",
    // "Apple 1 2 3",
    // "Google",
    // "Google 1 2 3",
    // "Microsoft",
    // "The Pinnacle",
    // "The Pinnacle 1 2 3",
    // "The Pinnacle!",
    "Jetflix Productions",
    //"Solotech US Corporation",
    "Local 197",
    // "Atlantic Records",
    // "Vector Management",
    // "ShowLive SFX",
    // "AMP Worldwide",
  ];

  for (const companyName of companyNames) {
    const result = await companyNameValidatorAgent(companyName);
    console.log(JSON.stringify(result, null, 2));
  }
})();

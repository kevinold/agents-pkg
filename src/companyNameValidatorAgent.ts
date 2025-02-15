import axios from "axios";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import OpenAI from "openai/index";
import { z } from "zod";

const systemPrompt =
  "You will be given a company name and you need to return a score between 0 and 100 " +
  "indicating how likely it is that the company name is real. " +
  "You will also return a reason for your score. " +
  "You may use the search function to look up information about the company, " +
  "if you are unsure if the company name is real. Only call search if you are unsure.\n\n" +
  "If the name follows an obviously generic pattern like 'Company 1' or 'Company !', " +
  "return a score of 0 and a reason that it is a generic name without calling search. " +
  "However, be aware that many legitimate companies use numbers and unique formatting " +
  "in their names, including:\n\n" +
  "- Unions, cooperatives, and historical businesses (like 'Local 197' or 'District 65')\n" +
  "- Entertainment and media companies (like 'Studio 54' or 'Channel 4')\n" +
  "- Special effects and production houses (like 'Digital Domain 3.0' or 'Unit 11')\n" +
  "- Record labels and music companies (like '4AD' or '88rising')\n" +
  "- Audio/visual equipment manufacturers and rental companies (like 'Stage 12 Audio' or 'Zone 3 Lighting')\n" +
  "- Entertainment technology service providers (like 'Level 2 Productions' or 'Area 51 VFX')\n" +
  "- Talent management and booking agencies (like 'Group 3 Management' or 'Division 6 Agency')\n" +
  "- Live event production companies (like 'Section 8 Productions' or 'District 7 Media')\n\n" +
  "Consider the full context of the name - if it appears to be a plausible organization " +
  "name within these or other legitimate business contexts rather than just a generic " +
  "placeholder, proceed with evaluation rather than automatically assigning a score of 0. " +
  "Pay attention to industry conventions and naming patterns when evaluating likelihood.";

const CompanyNameResponse = z.object({
  score: z.number(), // 0-100
  reason: z.string(),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function companyNameValidatorAgent(companyName: string) {
  const runner = await client.beta.chat.completions.runTools({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `validate the company name: ${companyName}`,
      },
    ],
    tools: [
      zodFunction({
        name: "search",
        parameters: z.object({ q: z.string() }),
        function: search,
      }),
    ],
    response_format: zodResponseFormat(
      CompanyNameResponse,
      "company_validation"
    ),
  });
  //.on("message", (message) => console.log(message));

  const finalContent = await runner.finalContent();
  //console.log("Final content:", finalContent);
  return finalContent;
}

async function search(args: { q: string }) {
  console.log("Searching for company name:", args.q);
  let data = JSON.stringify({
    q: args.q,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://google.serper.dev/search",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    //console.log("Search response:", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

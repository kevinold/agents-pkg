import axios from "axios";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import OpenAI from "openai/index";
import { z } from "zod";

const CompanyNameResponse = z.object({
  score: z.number(), // 0-100
  reason: z.string(),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function companyNameValidatorAgent(companyName: string) {
  const runner = await client.beta.chat.completions
    .runTools({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You will be given a company name and you need to return a score between 0 and 100 " +
            "indicating how likely it is that the company name is real. " +
            "You will also return a reason for your score. " +
            "You may use the search function to look up information about the company, " +
            "if you are unsure if the company name is real. Only call search if you are unsure." +
            "If it is obvious it uses a pattern like Company 1 or Company !, return a score of 0 " +
            "and a reason that it is a generic name without calling search.",
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
    })
    .on("message", (message) => console.log(message));

  const finalContent = await runner.finalContent();
  console.log("Final content:", finalContent);
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

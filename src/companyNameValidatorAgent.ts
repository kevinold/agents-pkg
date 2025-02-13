import { zodResponseFormat } from "openai/helpers/zod";
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
  const completion = await client.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You will be given a company name and you need to return a score between 0 and 100 " +
          "indicating how likely it is that the company name is real. " +
          "You will also return a reason for your score.",
      },
      { role: "user", content: `validate the company name: ${companyName}` },
    ],
    response_format: zodResponseFormat(
      CompanyNameResponse,
      "company_name_response",
    ),
  });

  const message = completion.choices[0]?.message;
  if (message?.parsed) {
    console.log(message.parsed.score);
    console.log(message.parsed.reason);
  }
  return message?.parsed;
}

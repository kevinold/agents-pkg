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
  try {
    const completion = await client.beta.chat.completions.parse({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You will be given a company name and you need to return a score between 0 and 100 " +
            "indicating how likely it is that the company name is real. " +
            "You will also return a reason for your score. " +
            "You may use the search function to look up information about the company, " +
            "if you are unsure if the company name is real.",
        },
        { role: "user", content: `validate the company name: ${companyName}` },
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

    console.log("Completion:", completion);

    const message = completion.choices[0]?.message;

    // Handle tool calls
    if (message?.tool_calls) {
      const toolCall = message.tool_calls[0];
      const searchResult = await search({
        q: toolCall.function.parsed_arguments.q,
      });

      // Send follow-up with search results
      const followUp = await client.beta.chat.completions.parse({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You will be given a company name and you need to return a score between 0 and 100 " +
              "indicating how likely it is that the company name is real. " +
              "You will also return a reason for your score. ",
          },
          {
            role: "user",
            content: `validate the company name: ${companyName}`,
          },
          message,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(searchResult),
          },
        ],
        response_format: zodResponseFormat(
          CompanyNameResponse,
          "company_validation"
        ),
      });

      const finalMessage = followUp.choices[0]?.message;
      return finalMessage?.parsed || null;
    }

    return message?.parsed || null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
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

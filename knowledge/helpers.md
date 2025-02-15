## Auto-parsing function tool calls

The `.parse()` method will also automatically parse `function` tool calls if:

- You use the `zodFunction()` helper method
- You mark your tool schema with `"strict": True`

For example:

```ts
import { zodFunction } from "openai/helpers/zod";
import OpenAI from "openai/index";
import { z } from "zod";

const Table = z.enum(["orders", "customers", "products"]);

const Column = z.enum([
  "id",
  "status",
  "expected_delivery_date",
  "delivered_at",
  "shipped_at",
  "ordered_at",
  "canceled_at",
]);

const Operator = z.enum(["=", ">", "<", "<=", ">=", "!="]);

const OrderBy = z.enum(["asc", "desc"]);

const DynamicValue = z.object({
  column_name: z.string(),
});

const Condition = z.object({
  column: z.string(),
  operator: Operator,
  value: z.union([z.string(), z.number(), DynamicValue]),
});

const Query = z.object({
  table_name: Table,
  columns: z.array(Column),
  conditions: z.array(Condition),
  order_by: OrderBy,
});

const client = new OpenAI();
const completion = await client.beta.chat.completions.parse({
  model: "gpt-4o-2024-08-06",
  messages: [
    {
      role: "system",
      content:
        "You are a helpful assistant. The current date is August 6, 2024. You help users query for the data they are looking for by calling the query function.",
    },
    {
      role: "user",
      content:
        "look up all my orders in november of last year that were fulfilled but not delivered on time",
    },
  ],
  tools: [zodFunction({ name: "query", parameters: Query })],
});
console.dir(completion, { depth: 10 });

const toolCall = completion.choices[0]?.message.tool_calls?.[0];
if (toolCall) {
  const args = toolCall.function.parsed_arguments as z.infer<typeof Query>;
  console.log(args);
  console.log(args.table_name);
}

main();
```

### Automated function calls

We provide the `openai.beta.chat.completions.runTools({…})`
convenience helper for using function tool calls with the `/chat/completions` endpoint
which automatically call the JavaScript functions you provide
and sends their results back to the `/chat/completions` endpoint,
looping as long as the model requests tool calls.

If you pass a `parse` function, it will automatically parse the `arguments` for you
and returns any parsing errors to the model to attempt auto-recovery.
Otherwise, the args will be passed to the function you provide as a string.

If you pass `tool_choice: {function: {name: …}}` instead of `auto`,
it returns immediately after calling that function (and only loops to auto-recover parsing errors).

```ts
import OpenAI from "openai";

const client = new OpenAI();

async function main() {
  const runner = client.beta.chat.completions
    .runTools({
      model: "gpt-4o",
      messages: [{ role: "user", content: "How is the weather this week?" }],
      tools: [
        {
          type: "function",
          function: {
            function: getCurrentLocation,
            parameters: { type: "object", properties: {} },
          },
        },
        {
          type: "function",
          function: {
            function: getWeather,
            parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
              },
            },
          },
        },
      ],
    })
    .on("message", (message) => console.log(message));

  const finalContent = await runner.finalContent();
  console.log();
  console.log("Final content:", finalContent);
}

async function getCurrentLocation() {
  return "Boston"; // Simulate lookup
}

async function getWeather(args: { location: string }) {
  const { location } = args;
  // … do lookup …
  return { temperature, precipitation };
}

main();
```

#### Integrate with `zod`

[`zod`](https://www.npmjs.com/package/zod) is a schema validation library which can help with validating the
assistant's response to make sure it conforms to a schema. Paired with [`zod-to-json-schema`](https://www.npmjs.com/package/zod-to-json-schema), the validation schema also acts as the `parameters` JSON Schema passed to the API.

```ts
import OpenAI from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const client = new OpenAI();

async function main() {
  const runner = client.chat.completions
    .runTools({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "How's the weather this week in Los Angeles?",
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            function: getWeather,
            parse: GetWeatherParameters.parse,
            parameters: zodToJsonSchema(GetWeatherParameters),
          },
        },
      ],
    })
    .on("message", (message) => console.log(message));

  const finalContent = await runner.finalContent();
  console.log("Final content:", finalContent);
}

const GetWeatherParameters = z.object({
  location: z.enum(["Boston", "New York City", "Los Angeles", "San Francisco"]),
});

async function getWeather(args: z.infer<typeof GetWeatherParameters>) {
  const { location } = args;
  // … do lookup …
  return { temperature, precipitation };
}

main();
```

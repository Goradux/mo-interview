import express, { json } from 'express'
import cors from "cors"

const app = express()
app.use(cors())
app.use(json())

const port = process.env.PORT || 3000

const apiKey = "your-key"

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openai = createOpenAI({
  headers: {
    'header-name': 'header-value',
  },
  apiKey,
});

let connection: express.Response | undefined = undefined

async function getLLMresponse(text: string, res: typeof connection) {
  console.log("sending stream request")
  const { fullStream } = streamText({
    model: openai('gpt-4o-mini'),
    prompt: text,
  });

  console.log("returning data")
  for await (const part of fullStream) {
    if (part.type === 'text-delta') {
      console.log(`Generating: ${part.text}`);
      res?.write(`data: ${part.text}\n\n`)
    } else if (part.type === 'text-end') {
      console.log("data: DONE!")
      res?.write("data: DONE!\n\n")
    }
  }
}

app.get('/connection', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');

  // save the connection for later use
  connection = res

  req.on("close", () => {
    console.log("disconnecting the client")
    connection = undefined
  })
})

app.post("/sendMessage", async (req, res) => {
  // parse the message from the frontend
  console.log(req.body)

  res.status(202).send("generation started!");

  // send request to openaAi
  await getLLMresponse(req.body.message, connection)
  // stream it back
})

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`)
})

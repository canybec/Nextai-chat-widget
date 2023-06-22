// ./app/api/chat/route.ts
import { Configuration, OpenAIApi } from 'openai-edge'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { supabase } from "@/lib/supabaseClient"
import { PineconeClient } from '@pinecone-database/pinecone'
import {
  queryPineconeVectorStoreAndQueryLLM,
} from '../../../utils'
import { indexName } from '../../../config'


// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)


// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'


// Create a placeholder to hold the current prompt
let currentPrompt: string | null = null;

async function savePromptAndCompletion(prompt: string, completion: string) {
  const { data, error } = await supabase
    .from('prompts_and_completions')
    .insert([
      { prompt: prompt, completion: completion }
    ]);

  if (error) {
    console.log(error);
    return;
  }

  console.log({ data });
}



export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json()
  const client = new PineconeClient()
  await client.init({
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || ''
  })
  const lastMessage = messages[messages.length - 1]; //new code
  const text = await queryPineconeVectorStoreAndQueryLLM(client, indexName, lastMessage.content);
  console.log(text);

  const newMessage = {
    ...lastMessage,
    content: 'USER QUESTION: ' + lastMessage.content + '\n' + '\n' + '\n' + 'VECTOR DATABASE SEARCH RESULTS: ' + text
  }
  // Update the messages array with the new message
  messages[messages.length - 1] = newMessage


  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: messages.map((message: any) => ({
      content: message.content,
      role: message.role
    }))
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    onStart: async () => {
      const msg = messages[messages.length - 1]['content']
      currentPrompt = msg;
    },
    onToken: async (token: string) => {
      console.log(token);
    },
    onCompletion: async (completion: string) => {
      if (currentPrompt) {
        await savePromptAndCompletion(currentPrompt, completion);
        // Reset current prompt
        currentPrompt = null;
      }
    },
  })
  // Respond with the stream
  return new StreamingTextResponse(stream)
}

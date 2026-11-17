import express from 'express'
import dotenv from "dotenv"
dotenv.config();

const app = express();

app.get("/", (req,res)=>{
    res.send("test success!")
})

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: "Explain how AI works in a few words",
  });
  console.log(interaction.output_text);
}

await main();

app.listen(4000, ()=>{
    console.log(`server running at http://localhost:4000`)
})

 
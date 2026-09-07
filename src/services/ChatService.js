import Groq from "groq-sdk"
import { SearchRepository } from "../repositories/SearchRepository.js"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const searchRepo = new SearchRepository()

// Fuzziness only fixes typos, not abbreviations ("ml" won't fuzzy-match "machine learning")
const JOB_TITLE_ABBREVIATIONS = {
  ml: "machine learning",
  ai: "artificial intelligence",
  swe: "software engineer",
  qa: "quality assurance",
  ux: "user experience",
  ui: "user interface",
  hr: "human resources",
  sre: "site reliability engineer",
  pm: "product manager",
  ds: "data science",
}

function expandAbbreviations(query) {
  return query
    .split(" ")
    .map((word) => {
      const key = word.toLowerCase().replace(/[^a-z]/g, "")
      return JOB_TITLE_ABBREVIATIONS[key]
        ? `${word} ${JOB_TITLE_ABBREVIATIONS[key]}`
        : word
    })
    .join(" ")
}

const SYSTEM_PROMPT = `You are SalaryScope Assistant, a helpful data analyst for a global salary intelligence platform with 137,000+ salary records worldwide.

IMPORTANT: You are given a SAMPLE of the most relevant records for the user's query — not the complete dataset. These are the top matches from a search engine. Do not say "I have no records for X" — instead say "I don't see records for X in the current results" and suggest the user try a more specific search.

Rules:
- Use only the salary records provided. Do not invent figures.
- Be concise and direct. Lead with the answer, then supporting detail.
- Format currency as USD with commas (e.g. $120,000).
- If the sample has no relevant records, say the search didn't surface them and suggest rephrasing.
- Keep responses under 150 words unless the user asks for detail.`

export class ChatService {
  async streamResponse(messages, res) {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user")
    const query = lastUserMessage?.content ?? ""

    // Search with a higher limit to get a broader sample
    const { records } = await searchRepo.search(expandAbbreviations(query), {
      limit: 15,
    })

    const context =
      records.length > 0
        ? `Top ${records.length} matching records (sample — not the full dataset):\n` +
          records
            .map((r, i) =>
              [
                `${i + 1}.`,
                r.jobTitle,
                r.country && `in ${r.city ? `${r.city}, ` : ""}${r.country}`,
                r.salaryInUsd
                  ? `$${Math.round(r.salaryInUsd).toLocaleString()} USD`
                  : r.salary
                    ? `${Math.round(Number(r.salary)).toLocaleString()}`
                    : null,
                r.experienceLevel && `(${r.experienceLevel})`,
                r.workYear && `${r.workYear}`,
              ]
                .filter(Boolean)
                .join(" — "),
            )
            .join("\n")
        : "The search returned no matching records for this query. Suggest the user try different keywords."

    const systemMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\n${context}`,
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [systemMessage, ...messages],
      stream: true,
      max_tokens: 300,
      temperature: 0.3,
    })

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? ""
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      }
    }

    res.write("data: [DONE]\n\n")
    res.end()
  }
}

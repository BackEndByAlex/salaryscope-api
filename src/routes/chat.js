import { Router } from "express"
import { ChatService } from "../services/ChatService.js"

const router = Router()
const chatService = new ChatService()

router.post("/", async (req, res) => {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." })
  }

  const valid = messages.every(
    (m) => m && typeof m.role === "string" && typeof m.content === "string",
  )
  if (!valid) {
    return res
      .status(400)
      .json({ error: "Each message must have role and content strings." })
  }

  try {
    await chatService.streamResponse(messages, res)
  } catch (err) {
    console.error("Chat error:", err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: "Chat service unavailable." })
    } else {
      res.write("data: [ERROR]\n\n")
      res.end()
    }
  }
})

export default router

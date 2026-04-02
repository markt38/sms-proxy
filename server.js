import express from "express"

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// store messages in memory
let messages = []

// inbound from AAISP
app.all("/inbound", (req, res) => {
  const from = req.body.from || req.query.from
  const text = req.body.text || req.query.text

  if (from && text) {
    let cleanFrom = from

    // fix UK format if needed
    if (cleanFrom.startsWith("0")) {
      cleanFrom = "44" + cleanFrom.substring(1)
    }

    messages.push({
      from: cleanFrom,
      text: text,
      time: Date.now()
    })

    console.log("Received SMS:", cleanFrom, text)
  }

  res.send("OK")
})

// fetch for Groundwire
app.get("/fetch", (req, res) => {
  const xml = messages.map(m => `
<sms>
<from>${m.from}</from>
<body>${escapeXml(m.text)}</body>
</sms>`).join("")

  // clear messages after sending
  messages = []

  res.set("Content-Type", "text/xml")
  res.send(`<response>${xml}</response>`)
})

// helper to escape XML characters
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Server running on port", PORT)
})

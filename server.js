const express = require("express")

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

let messages = []

app.all("/inbound", (req, res) => {
  const from = req.body.from || req.query.from
  const text = req.body.text || req.query.text

  if (from && text) {
    let cleanFrom = from

    if (cleanFrom.startsWith("0")) {
      cleanFrom = "44" + cleanFrom.substring(1)
    }

    messages.push({
      from: cleanFrom,
      text: text,
      time: Date.now(),
      delivered: false
    })

    console.log("Received SMS:", cleanFrom, text)
  }

  res.send("OK")
})

app.get("/fetch", (req, res) => {
  const xml = messages
    .filter(m => !m.delivered)
    .map(m => {
      m.delivered = true
      return `
<sms>
<from>${m.from}</from>
<body>${escapeXml(m.text)}</body>
</sms>`
    })
    .join("")

  // keep only last 100 messages
  messages = messages.slice(-100)

  res.set("Content-Type", "text/xml")
  res.send(`<response>${xml}</response>`)
})

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT)
})

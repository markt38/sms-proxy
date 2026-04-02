const express = require("express")

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

let messages = []

app.all("/inbound", (req, res) => {
  console.log("RAW BODY:", req.body)
  console.log("RAW QUERY:", req.query)

  const from =
    req.body.from ||
    req.body.originator ||
    req.body.oa ||
    req.query.from ||
    req.query.originator ||
    req.query.oa

  const text =
    req.body.text ||
    req.body.message ||
    req.body.ud ||
    req.query.text ||
    req.query.message ||
    req.query.ud

  if (from && text) {
    let cleanFrom = from.replace("+", "")

    if (cleanFrom.startsWith("0")) {
      cleanFrom = "44" + cleanFrom.substring(1)
    }

    messages.push({
      from: cleanFrom,
      text: text,
      time: Date.now(),
      delivered: false
    })

    console.log("Stored SMS:", cleanFrom, text)
  } else {
    console.log("Missing fields:", { from, text })
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

  // keep last 100 messages only
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

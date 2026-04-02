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

    messages.push({ from: cleanFrom, text })
    console.log("Received SMS:", cleanFrom, text)
  }

  res.send("OK")
})

app.get("/fetch", (req, res) => {
  const xml = messages.map(m => `
<sms>
<from>${m.from}</from>
<body>${m.text}</body>
</sms>`).join("")

  messages = []

  res.set("Content-Type", "text/xml")
  res.send(`<response>${xml}</response>`)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT)
})

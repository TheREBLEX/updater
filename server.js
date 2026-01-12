import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "TheREBLEX";
const REPO = "updater";

app.post("/check-hwid", async (req, res) => {
    const { hwid } = req.body;

    if (!hwid) {
        return res.status(400).json({ error: "No HWID" });
    }

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/bans/${hwid}.json`;

    try {
        const r = await fetch(url, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                "User-Agent": "REBLEX"
            }
        });

        // 🆕 No existe → crear
        if (r.status === 404) {
            const data = {
                hwid,
                ban: false,
                motivo: "Auto registered",
                firstSeen: new Date().toISOString()
            };

            const body = {
                message: `Register HWID ${hwid}`,
                content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64")
            };

            await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    "Content-Type": "application/json",
                    "User-Agent": "REBLEX"
                },
                body: JSON.stringify(body)
            });

            return res.json({ ban: false });
        }

        // 📖 Existe → leer
        const json = await r.json();
        const decoded = JSON.parse(
            Buffer.from(json.content, "base64").toString()
        );

        return res.json(decoded);

    } catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
});

app.listen(3000, () => console.log("Server running"));
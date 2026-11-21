import { createRouter } from "../lib/router.js";
import { config } from "../config.js";
import { resetDemoLab } from "../lib/demo-lab-reset.js";
import { runDayBeforeReminders } from "../lib/reminders.js";

export const cronRouter = createRouter();

cronRouter.get('/reminders', requireCronSecret, async (req,res) => {
  const result=await runDayBeforeReminders({dryRun:req.query.dryRun==='1'});
  if(result.disabled)return res.status(503).json({error:'WhatsApp is not configured. No reminders were sent.'});
  console.log('[cron] reminder summary:',result);
  const ok=result.failed===0&&result.uncertain===0&&!result.limited;
  res.status(ok?200:503).json({ok,...result});
});

function requireCronSecret(req, res, next) {
  const expected = config.cronSecret;
  if (!expected) {
    return res.status(503).json({ error: "CRON_SECRET is not set." });
  }
  const given = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (given !== expected) {
    return res.status(401).json({ error: "Not authorised." });
  }
  next();
}


cronRouter.get("/reset-demo-lab", requireCronSecret, async (req, res) => {
  try {
    const result = await resetDemoLab();
    console.log("[cron] demo lab reset:", result);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron] demo lab reset failed:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

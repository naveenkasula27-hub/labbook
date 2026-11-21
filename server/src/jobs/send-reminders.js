/** Manual day-before reminder runner. --dry-run does not send or claim bookings. */
import { connectDb, disconnectDb } from '../db.js';
import { runDayBeforeReminders } from '../lib/reminders.js';

async function main() {
  try {
    await connectDb();
    const result=await runDayBeforeReminders({dryRun:process.argv.includes('--dry-run')});
    console.log('Reminder summary:',result);
    if(result.disabled||result.failed||result.uncertain||result.limited)process.exitCode=1;
  } finally {await disconnectDb();}
}
main().catch(error=>{console.error('Reminder run failed:',error.message);process.exitCode=1;});

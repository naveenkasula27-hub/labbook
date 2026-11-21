import { randomUUID } from 'node:crypto';
import { Lab } from '../models/Lab.js';
import { Booking } from '../models/Booking.js';
import { Test } from '../models/Test.js';
import { Package } from '../models/Package.js';
import { config } from '../config.js';
import { remindPatient } from '../services/whatsapp.js';
import { dateInZone, addDays } from './dates.js';

const terminalStatuses=['cancelled','no_show','completed'];
const blockedStates=['sending','sent','uncertain'];
export const reminderDate=(now,timezone)=>addDays(dateInZone(now,timezone||'Asia/Kolkata'),1);

async function fastingFor(models, lab, items=[]) {
  const tests=items.filter(i=>i.kind==='test').map(i=>i.code);
  const packages=items.filter(i=>i.kind==='package').map(i=>i.code);
  const rows=[...(tests.length?await models.Test.find({lab,code:{$in:tests}}).select('fasting'):[]),...(packages.length?await models.Package.find({lab,code:{$in:packages}}).select('fasting'):[])];
  const notes=[...new Set(rows.map(r=>r.fasting?.trim()).filter(Boolean))];
  return notes.length?`Fasting needed: ${notes.join('; ')}`:'';
}

/** Safe to import; dependencies can be replaced by isolated test fixtures. */
export async function runDayBeforeReminders({dryRun=false,now=new Date(),enabled=config.whatsapp.enabled,models={Lab,Booking,Test,Package},notify=remindPatient,batchLimit=500,timeBudgetMs=240000}={}) {
  const started=Date.now();
  const result={sent:0,failed:0,skipped:0,uncertain:0,alreadyClaimed:0,candidates:0,limited:false,disabled:!enabled&&!dryRun,dryRun};
  if(result.disabled)return result;
  const labs=await models.Lab.find({active:true,isDemo:{$ne:true},'notify.reminderDayBefore':{$ne:false}});
  const jobs=[];
  for(const lab of labs) {
    if(lab.active===false||lab.isDemo||lab.notify?.reminderDayBefore===false)continue;
    const date=reminderDate(now,lab.timezone);
    const filter={lab:lab._id,date,consent:true,status:{$nin:terminalStatuses},'messages.reminderSent':{$ne:true},'messages.reminderState':{$nin:blockedStates}};
    const remaining=batchLimit-jobs.length;
    if(remaining<=0){result.limited=true;break;}
    const rows=await models.Booking.find(filter).limit(remaining+1);
    if(rows.length>remaining)result.limited=true;
    for(const booking of rows.slice(0,remaining))jobs.push({lab,booking,filter});
  }
  result.candidates=jobs.length;
  if(dryRun)return result;
  let next=0;
  async function worker() {
    while(next<jobs.length) {
      if(Date.now()-started>=timeBudgetMs){result.limited=true;return;}
      const {lab,booking,filter}=jobs[next++];
      const token=randomUUID();
      let claimed;
      try {claimed=await models.Booking.findOneAndUpdate({...filter,_id:booking._id},{$set:{'messages.reminderState':'sending','messages.reminderClaimToken':token,'messages.reminderAttemptedAt':now}},{new:true});}
      catch {result.failed++;continue;}
      if(!claimed){result.alreadyClaimed++;continue;}
      const claimFilter={_id:booking._id,lab:lab._id,'messages.reminderClaimToken':token};
      let accepted=false,attempted=false;
      try {
        const fasting=await fastingFor(models,lab._id,claimed.items);
        attempted=true;
        const response=await notify(lab,claimed,fasting);
        if(response?.skipped) {
          await models.Booking.updateOne(claimFilter,{$set:{'messages.reminderState':'pending'},$unset:{'messages.reminderClaimToken':1}});
          result.skipped++;continue;
        }
        const messageId=response?.messages?.[0]?.id;
        if(!messageId)throw new Error('Provider acceptance was not confirmed.');
        accepted=true;
        const saved=await models.Booking.updateOne(claimFilter,{$set:{'messages.reminderSent':true,'messages.reminderState':'sent','messages.reminderSentAt':new Date(),'messages.reminderProviderId':messageId},$unset:{'messages.reminderClaimToken':1}});
        if(saved.modifiedCount !== 1)throw new Error('Accepted reminder could not be recorded.');
        result.sent++;
      } catch(error) {
        // Uncertain delivery is never automatically retried: doing so can duplicate a reminder.
        const definitive=!accepted&&(!attempted||(error.status>=400&&error.status<500));
        const state=definitive?'failed':'uncertain';
        try {await models.Booking.updateOne(claimFilter,{$set:{'messages.reminderState':state},$unset:{'messages.reminderClaimToken':1}});}catch{/* A retained sending claim still prevents duplicates. */}
        result[state==='failed'?'failed':'uncertain']++;
      }
    }
  }
  await Promise.all(Array.from({length:Math.min(4,jobs.length)},worker));
  return result;
}

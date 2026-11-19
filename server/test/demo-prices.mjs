import test from 'node:test';
import assert from 'node:assert/strict';
import { cataloguePrice } from '../src/lib/demo-prices.js';
test('live labs keep missing prices on request, regardless of service', () => {
  for (const category of ['Routine','Fever','Scans']) assert.deepEqual(cataloguePrice({category,price:null}, {isDemo:false,currency:'INR'}), {price:null,priceIsSample:false});
});
test('owner prices including zero are preserved for both demos and live labs', () => {
  for (const isDemo of [true,false]) for (const price of [0,75,1234.5]) assert.deepEqual(cataloguePrice({price}, {isDemo}), {price,priceIsSample:false});
});
test('demo prices are stable and do not mutate the catalogue row', () => {
  const row = {name:'Fever panel',category:'Fever',price:null}; const before=structuredClone(row);
  const displayed=cataloguePrice(row,{isDemo:true,currency:'INR'});
  const booked=cataloguePrice(structuredClone(row),{isDemo:true,currency:'INR'});
  assert.deepEqual(displayed,booked); assert.ok(displayed.price>0); assert.equal(displayed.priceIsSample,true); assert.deepEqual(row,before);
});
test('demo package amount does not depend on selected individual tests', () => {
  const pack={name:'Health check',testCodes:['CBC','FBS','TSH'],price:null};
  assert.deepEqual(cataloguePrice(pack,{isDemo:true},'package'),cataloguePrice({...pack},{isDemo:true},'package'));
  assert.ok(cataloguePrice(pack,{isDemo:true},'package').price>0);
});
test('no rupee sample amounts are assigned to demos in other currencies', () => {
  assert.deepEqual(cataloguePrice({price:null,category:'Fever'},{isDemo:true,currency:'USD'}),{price:null,priceIsSample:false});
});

test('HTTP catalogue and booking totals agree, and live labs retain prices on request', async () => {
  process.env.JWT_SECRET='sample-price-test'; process.env.MONGODB_URI='mongodb://127.0.0.1:27017/unused';
  process.env.WHATSAPP_ACCESS_TOKEN='';
  const { createApp }=await import('../src/index.js');
  const { Lab }=await import('../src/models/Lab.js');
  const { Test }=await import('../src/models/Test.js');
  const { Package }=await import('../src/models/Package.js');
  const { Booking }=await import('../src/models/Booking.js');
  const { RateBucket }=await import('../src/models/RateBucket.js');
  let demo=true, saved;
  const row={code:'FEVER',name:'Fever panel',category:'Fever',sample:'Blood',price:null};
  const pack={code:'HEALTH',name:'Health check',testCodes:['FEVER'],price:null};
  const query=(value) => { const q={select:()=>q,sort:()=>q,lean:async()=>value}; return q; };
  Lab.findOne=async()=>({_id:'aaaaaaaaaaaaaaaaaaaaaaaa',name:'Example Lab',slug:'example',isDemo:demo,country:'IN',currency:'INR',timezone:'Asia/Kolkata',phone:'9999999999',slots:[],openDays:[0,1,2,3,4,5,6]});
  Test.find=()=>query([row]); Package.find=()=>query([pack]);
  Booking.create=async(fields)=>{saved=fields; return {...fields,_id:'bbbbbbbbbbbbbbbbbbbbbbbb'};};
  RateBucket.findOneAndUpdate=async()=>({count:1});
  const server=createApp().listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/public/example`;
  try {
    const catalogue=await (await fetch(base)).json();
    assert.equal(catalogue.tests[0].priceIsSample,true);
    const response=await fetch(`${base}/bookings`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Sample Patient',age:30,gender:'Other',phone:'9999999999',testCodes:['FEVER'],packageCodes:['HEALTH'],consent:true,price:1})});
    assert.equal(response.status,201); const booking=await response.json();
    assert.equal(booking.estimatedTotal,catalogue.tests[0].price+catalogue.packages[0].price);
    assert.equal(saved.items[0].price,catalogue.packages[0].price);
    demo=false;
    const real=await (await fetch(base)).json(); assert.equal(real.tests[0].price,null); assert.equal(real.tests[0].priceIsSample,false);
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
});

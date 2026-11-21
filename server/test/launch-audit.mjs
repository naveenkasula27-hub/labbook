import test from 'node:test';
import assert from 'node:assert/strict';
process.env.JWT_SECRET='audit-isolated-tests';
process.env.MONGODB_URI='mongodb://127.0.0.1:27017/unused_audit_tests';
const {createApp}=await import('../src/index.js');
const {Lab}=await import('../src/models/Lab.js');
const {RateBucket}=await import('../src/models/RateBucket.js');
Lab.findOne=async()=>({_id:'aaaaaaaaaaaaaaaaaaaaaaaa',country:'IN'});
RateBucket.findOneAndUpdate=async()=>({count:1});
let server,base;
test.before(async()=>{server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;});
test.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
test('API unknown paths return JSON 404 and hardened response headers',async()=>{
 const response=await fetch(base+'/api/audit-missing');assert.equal(response.status,404);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-powered-by'),null);assert.deepEqual(await response.json(),{error:'Not found.'});
});
test('invalid JSON is rejected before any booking can be saved',async()=>{
 const response=await fetch(base+'/api/public/example/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad-json'});assert.equal(response.status,400);assert(!JSON.stringify(await response.json()).includes('SyntaxError'));
});
test('oversized JSON is rejected with 413',async()=>{
 const response=await fetch(base+'/api/public/example/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notes:'x'.repeat(110000)})});assert.equal(response.status,413);
});
test('upgraded validator preserves clear booking consent errors',async()=>{
 const response=await fetch(base+'/api/public/example/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Sample Patient',age:30,gender:'Other',phone:'9999999999',consent:false})});assert.equal(response.status,400);assert.match((await response.json()).error,/Tick the consent box/);
});

import test from "node:test";
import assert from "node:assert/strict";
process.env.JWT_SECRET = "doctor-test-secret";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/unused_doctor_tests";
const { createApp } = await import("../src/index.js");
const { signToken } = await import("../src/lib/jwt.js");
const { Doctor } = await import("../src/models/Doctor.js");
const { Enquiry } = await import("../src/models/Enquiry.js");
const { Lab } = await import("../src/models/Lab.js");
const { User } = await import("../src/models/User.js");
const { RateBucket } = await import("../src/models/RateBucket.js");
const { todayInZone, addDays } = await import("../src/lib/dates.js");
const A = "aaaaaaaaaaaaaaaaaaaaaaaa", B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const token = signToken({ _id: "111111111111111111111111", lab: A, role: "owner" });
const profile = { code: "doc-example", name: "Example Doctor", specialty: "General Medicine", portrait: "general" };
let server, base, seen, savedDoctor, savedEnquiry, available, demo, home, rows;
function query(value) { const q = { select: () => q, sort: () => q, lean: async () => value, then: (ok,bad) => Promise.resolve(value).then(ok,bad) }; return q; }
test.before(async () => {
  Lab.findOne = async () => ({ _id: A, country: "IN", timezone: "Asia/Kolkata", isDemo: demo, homeCollection: home, openDays: [0,1,2,3,4,5,6] });
  Lab.findById = () => query({ _id: A, active: true });
  User.findById = () => query({ _id: "111111111111111111111111", lab: A, active: true, sessionVersion: 0 });
  RateBucket.findOneAndUpdate = async () => ({ count: 1 });
  Doctor.find = (filter) => { seen.push(filter); return query(rows); };
  Doctor.findOne = (filter) => { seen.push(filter); return query(available ? profile : null); };
  Doctor.create = async (value) => { savedDoctor = value; return profile; };
  Doctor.findOneAndUpdate = (filter) => { seen.push(filter); return query(available ? profile : null); };
  Enquiry.create = async (value) => { savedEnquiry = value; return { reference: "CB-EXAMPLE" }; };
  server = createApp().listen(0,"127.0.0.1"); await new Promise((r) => server.once("listening",r)); base = `http://127.0.0.1:${server.address().port}/api`;
});
test.beforeEach(() => { seen=[]; savedDoctor=null; savedEnquiry=null; available=true; demo=false; home=true; rows=[profile]; });
test.after(async () => { server.closeAllConnections(); await new Promise((r) => server.close(r)); });
async function hit(path, { method="GET", body, auth=false }={}) { const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",...(auth?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}); return {status:response.status,data:await response.json()}; }
const callback = {name:"Sample Patient",phone:"9999999999"};
function request(kind="consultation") { return {...callback,kind,preferredDate:todayInZone("Asia/Kolkata"),preferredTime:"morning",doctorCode:profile.code}; }
test("public doctors contain only active profiles for the URL lab",async()=>{ const result=await hit("/public/example/doctors"); assert.equal(result.status,200); assert.deepEqual(seen[0],{lab:A,active:true}); });
test("empty real lab never displays fictional doctor profiles",async()=>{rows=[]; assert.deepEqual((await hit("/public/example/doctors")).data.doctors,[]);});
test("sample profiles are restricted to explicitly marked demo labs",async()=>{rows=[];demo=true;const result=await hit("/public/example/doctors");assert.equal(result.data.doctors.length,3);assert(result.data.doctors.every((row)=>row.isDemo));});
test("owner doctor creation ignores a client-supplied lab",async()=>{const result=await hit("/dashboard/doctors",{method:"POST",auth:true,body:{...profile,lab:B,fee:500}});assert.equal(result.status,201);assert.equal(savedDoctor.lab,A);});
test("doctor list and edits are always scoped to signed-in lab",async()=>{await hit(`/dashboard/doctors?lab=${B}`,{auth:true});await hit(`/dashboard/doctors/${profile.code}`,{method:"PATCH",auth:true,body:{active:false,lab:B}});assert.equal(seen.length,2);assert(seen.every((filter)=>filter.lab===A));});
test("unauthenticated profile changes are refused",async()=>{assert.equal((await hit("/dashboard/doctors",{method:"POST",body:profile})).status,401);assert.equal(savedDoctor,null);});
test("another lab's doctor cannot be edited",async()=>{available=false;assert.equal((await hit(`/dashboard/doctors/${profile.code}`,{method:"PATCH",auth:true,body:{active:false}})).status,404);});
test("unsafe photo URLs and negative fees are rejected",async()=>{for(const body of [{...profile,photoUrl:"javascript:alert(1)"},{...profile,fee:-1}])assert.equal((await hit("/dashboard/doctors",{method:"POST",auth:true,body})).status,400);assert.equal(savedDoctor,null);});
test("consultation requests snapshot the doctor from this lab",async()=>{assert.equal((await hit("/public/example/enquiries",{method:"POST",body:request()})).status,201);assert.equal(savedEnquiry.doctorName,profile.name);assert.equal(savedEnquiry.kind,"consultation");assert.deepEqual(seen[0],{lab:A,code:profile.code,active:true});});
test("unavailable doctor cannot receive consultation requests",async()=>{available=false;assert.equal((await hit("/public/example/enquiries",{method:"POST",body:request()})).status,400);assert.equal(savedEnquiry,null);});
test("sample doctor cannot be requested on a real lab",async()=>{available=false;assert.equal((await hit("/public/example/enquiries",{method:"POST",body:{...request(),doctorCode:"sample-general"}})).status,400);});
test("sample doctor request works only on a demo",async()=>{available=false;demo=true;assert.equal((await hit("/public/example/enquiries",{method:"POST",body:{...request(),doctorCode:"sample-general"}})).status,201);assert.equal(savedEnquiry.doctorCode,"sample-general");});
test("home-collection requests preserve date, period and email",async()=>{const body={...request("home_collection"),email:"sample@example.test"};assert.equal((await hit("/public/example/enquiries",{method:"POST",body})).status,201);assert.equal(savedEnquiry.email,body.email);assert.equal(savedEnquiry.preferredDate,body.preferredDate);assert.equal(savedEnquiry.doctorCode,"");});
test("home collection cannot be requested if the lab disables it",async()=>{home=false;assert.equal((await hit("/public/example/enquiries",{method:"POST",body:request("home_collection")})).status,400);});
test("invalid dates, past dates, distant dates and missing periods are refused",async()=>{for(const changes of [{preferredDate:"2026-02-31"},{preferredDate:addDays(todayInZone("Asia/Kolkata"),-1)},{preferredDate:addDays(todayInZone("Asia/Kolkata"),91)},{preferredTime:""}])assert.equal((await hit("/public/example/enquiries",{method:"POST",body:{...request(),...changes}})).status,400);assert.equal(savedEnquiry,null);});

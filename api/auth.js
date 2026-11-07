"use strict";
module.exports=async function authProxy(req,res){
const allowed=new Set(["sign-up/email","sign-in/email","sign-out","get-session","forget-password","reset-password","send-verification-email","verify-email"]);
const path=String(req.query?.path||"").replace(/^\/+|\/+$/g,"");
if(!allowed.has(path))return res.status(404).json({error:"Endpoint không tồn tại."});
if(req.method!=="POST"&&!(req.method==="GET"&&["get-session","verify-email"].includes(path)))return res.status(405).json({error:"Phương thức không hỗ trợ."});
if(req.method==="POST"&&req.headers.origin&&!([`https://${req.headers.host}`,"http://localhost:3000","http://localhost:4173"].includes(req.headers.origin)))return res.status(403).json({error:"Nguồn không hợp lệ."});
try{
const headers={"accept":"application/json","content-type":"application/json",origin:"https://prompt-chat.vercel.app"};
if(req.headers.cookie)headers.cookie=req.headers.cookie;
const response=await fetch(process.env.NEON_AUTH_URL+"/"+path,{method:req.method,headers,body:req.method==="POST"?JSON.stringify(req.body||{}):undefined,redirect:"manual",cache:"no-store"});
res.status(response.status);res.setHeader("Cache-Control","no-store");res.setHeader("Content-Type",response.headers.get("content-type")||"application/json");
const setCookies=response.headers.getSetCookie?.()||[];
if(setCookies.length)res.setHeader("Set-Cookie",setCookies.map(c=>c.replace(/;\s*Domain=[^;]+/gi,"")));
const location=response.headers.get("location");if(location&&location.startsWith("/"))res.setHeader("Location",location);
return res.send(await response.text());
}catch(e){console.error("auth proxy",e.message);return res.status(502).json({error:"Không kết nối được dịch vụ đăng nhập."})}
};

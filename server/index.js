import express from 'express';import cors from 'cors';import fs from 'fs';import crypto from 'crypto';
if (fs.existsSync('.env')) {
  fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}
const F='server/db.json';const db=fs.existsSync(F)?JSON.parse(fs.readFileSync(F)):{users:[],tx:[],goals:[]};
const save=()=>fs.writeFileSync(F,JSON.stringify(db));
const uid=()=>crypto.randomUUID().slice(0,8).toUpperCase();
const hash=p=>crypto.createHash('sha256').update(p).digest('hex');
const pub=({id,name,email,role,token})=>({id,name,email,role,token});
const app=express();app.use(cors(),express.json());
const auth=(q,r,n)=>{const u=db.users.find(u=>u.token===q.headers.authorization);u?(q.user=u,n()):r.status(401).json({error:'Please log in again'})};
const optionalAuth=(q,r,n)=>{if(q.headers.authorization){const u=db.users.find(u=>u.token===q.headers.authorization);if(u){q.user=u;return n()}}q.user={id:'GUEST',name:'Friend',role:'Visitor'};n()};
app.post('/api/register',(q,r)=>{const{name,email,password,role='Salaried'}=q.body;
 if(!name||!email||!password)return r.status(400).json({error:'Name, email and password are required'});
 if(db.users.some(u=>u.email===email))return r.status(409).json({error:'This email is already registered'});
 const u={id:'FW-'+uid(),name,email,role,pw:hash(password),token:crypto.randomUUID()};db.users.push(u);save();r.json(pub(u))});
app.post('/api/login',(q,r)=>{const u=db.users.find(u=>u.email===q.body.email&&u.pw===hash(q.body.password||''));u?r.json(pub(u)):r.status(401).json({error:'Wrong email or password'})});
app.get('/api/tx',auth,(q,r)=>r.json(db.tx.filter(t=>t.uid===q.user.id)));
app.post('/api/tx',auth,(q,r)=>{const{type,category,amount,note='',date}=q.body;if(!(amount>0))return r.status(400).json({error:'Enter an amount above ₹0'});
 const t={id:uid(),uid:q.user.id,type,category,amount:+amount,note,date:date||new Date().toISOString().slice(0,10)};db.tx.push(t);save();r.json(t)});
app.delete('/api/tx/:id',auth,(q,r)=>{db.tx=db.tx.filter(t=>!(t.id===q.params.id&&t.uid===q.user.id));save();r.json({ok:1})});
app.get('/api/goals',auth,(q,r)=>r.json(db.goals.filter(g=>g.uid===q.user.id)));
app.post('/api/goals',auth,(q,r)=>{const g={id:uid(),uid:q.user.id,name:q.body.name,target:+q.body.target,saved:0};db.goals.push(g);save();r.json(g)});
app.put('/api/goals/:id',auth,(q,r)=>{const g=db.goals.find(g=>g.id===q.params.id&&g.uid===q.user.id);if(g){g.saved+=+q.body.add;save()}r.json(g)});
const KB=[[/sip|mutual|elss|fund/,'For most beginners, a monthly SIP in a low-cost Nifty 50 index fund is a solid start. Add a flexi-cap fund for diversification and ELSS if you want 80C tax saving (3-year lock-in). Stay invested 5+ years and raise your SIP 10% every year.'],
[/stock|share|equity|demat/,'Start with index funds before picking stocks. If you buy stocks, keep them under 10-15% of your portfolio, diversify across sectors, and never invest money you need within 3 years.'],
[/fd|fixed deposit|rd|debt|bond/,'FDs suit goals under 3 years and your emergency fund. For slightly better post-tax returns, look at short-duration debt funds or PPF (7.1% tax-free, 15-year lock-in).'],
[/ppf|nps|epf|retire|pension/,'PPF gives safe, tax-free returns. NPS adds an extra Rs 50,000 deduction under 80CCD(1B) and suits retirement. Combine both with equity SIPs for growth.'],
[/tax|80c|itr/,'Under the old regime, 80C (up to Rs 1.5 lakh via ELSS, PPF, EPF, life insurance) and 80D (health insurance) cut tax. Compare old vs new regime every year before choosing.'],
[/emergency|save|saving|budget|spend/,'Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Build an emergency fund of 6 months of expenses in a liquid fund or savings account first.'],
[/insur|term|health|credit|loan|emi/,'Buy a pure term plan (about 10-15x annual income) and a health cover of Rs 10 lakh+ before investing. Keep credit-card use under 30% of your limit and clear high-interest loans first.'],
[/gold|crypto|real estate|property/,'Keep gold (Sovereign Gold Bonds or gold ETFs) at 5-10% of your portfolio. Treat crypto as high-risk, under 5%. Property needs large capital and is illiquid.']];
const local=t=>(KB.find(([re])=>re.test(t.toLowerCase()))||[0,'I can help with budgeting, SIPs, mutual funds, stocks, FD/PPF/NPS, tax saving, insurance and loans. Tell me your monthly income, goal and time horizon for a specific plan.'])[1]+'\n\nThis is educational guidance, not SEBI-registered advice.';
app.post('/api/chat',optionalAuth,async(q,r)=>{const m=new Date().toISOString().slice(0,7);const cur=db.tx.filter(t=>t.uid===q.user.id&&t.date.startsWith(m));
 const s=t=>cur.filter(x=>x.type===t).reduce((a,x)=>a+x.amount,0);const msgs=q.body.messages||[];
 const sys=`You are FinWise, a friendly Indian personal finance advisor. Answer any finance question (budgeting, SIP, mutual funds, stocks, FD, PPF, NPS, tax, insurance, loans) in INR (₹) with clear steps. Be concise and add a short not-SEBI-registered-advice note for investment suggestions. User: ${q.user.name} (${q.user.role}); this month income Rs ${s('income')}, expenses Rs ${s('expense')}.`;
 if(process.env.OPENROUTER_API_KEY){try{const resp=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':'http://localhost:5173','X-Title':'FinWise'},body:JSON.stringify({model:'meta-llama/llama-3.3-70b-instruct',max_tokens:800,messages:[{role:'system',content:sys},...msgs]})});
 const data=await resp.json();if(data.choices?.[0]?.message?.content)return r.json({reply:data.choices[0].message.content})}catch{}}
 if(process.env.ANTHROPIC_API_KEY){try{const a=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
 body:JSON.stringify({model:'claude-sonnet-5',max_tokens:900,system:sys,messages:msgs})});
 const d=await a.json();if(d.content?.[0]?.text)return r.json({reply:d.content[0].text})}catch{}}
 r.json({reply:local(msgs.at(-1)?.content||'')})});
app.listen(5000,()=>console.log('API on :5000'));


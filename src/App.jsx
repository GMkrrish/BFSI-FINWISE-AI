import React, {useState,useEffect,useRef,useContext,createContext} from 'react';
import {BrowserRouter,Routes,Route,NavLink,Link,Navigate,useNavigate} from 'react-router-dom';
import {motion,useInView,animate} from 'framer-motion';
import {PieChart,Pie,Cell,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,Legend} from 'recharts';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('FinWise ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center">
          <div className="glass p-5 mx-auto" style={{ maxWidth: 500 }}>
            <h3 className="text-warning mb-3">Something went wrong</h3>
            <p className="text-slate-300 mb-4">{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
            <button className="btn btn-saffron" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Reset & Go Home</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Ctx=createContext();const useC=()=>useContext(Ctx);
const inr=n=>'₹'+Math.round(n||0).toLocaleString('en-IN');
const CATS=['Rent','Food','Transport','Utilities','Healthcare','Education','Entertainment','Shopping','Other'];
const NEEDS=['Rent','Food','Transport','Utilities','Healthcare','Education'];
const INCOME_SRC=['Salary','Freelance','Allowance','Business','Other'];
const COL=['#ff9933','#22a559','#4c8dff','#e8558a','#a78bfa','#2dd4bf','#f2c14e','#94a3b8','#fb7185'];
const sum=(a,t)=>(a||[]).filter(x=>x.type===t).reduce((s,x)=>s+x.amount,0);
const stats=(tx=[],m=new Date().toISOString().slice(0,7))=>{
  const c=(tx||[]).filter(t=>t.date?.startsWith(m));
  const inc=sum(c,'income'),exp=sum(c,'expense'),by={};
  c.filter(t=>t.type==='expense').forEach(t=>by[t.category]=(by[t.category]||0)+t.amount);
  return{inc,exp,sav:inc-exp,by,rate:inc?Math.round((inc-exp)/inc*100):0};
};

const api=async(p,o={},u)=>{
  const r=await fetch('/api'+p,{
    method:o.method||'GET',
    headers:{'Content-Type':'application/json',Authorization:u?.token||''},
    body:o.body?JSON.stringify(o.body):undefined
  });
  let d;
  try {
    d = await r.json();
  } catch {
    d = { error: 'Network response error' };
  }
  if(!r.ok)throw new Error(d.error||'Something went wrong');
  return d;
};

const Page=({children})=><motion.main className="container py-5" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.35}}>{children}</motion.main>;
const Empty=()=><p className="text-slate-300 p-4">No data yet. <Link to="/transactions" className="text-warning">Add your first income and expense</Link>.</p>;
const Card=({children,i=0,className=''})=><motion.div className={'glass p-4 '+className} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.06}} whileHover={{y:-3}}>{children}</motion.div>;
const Count=({to,pre='',suf=''})=>{const r=useRef();const v=useInView(r,{once:true});
 useEffect(()=>{if(v)animate(0,to,{duration:1.5,onUpdate:x=>r.current&&(r.current.textContent=pre+Math.round(x).toLocaleString('en-IN')+suf)})},[v,to,pre,suf]);return <span ref={r}>0</span>};

function Nav(){
  const{user,logout}=useC();
  const[open,setOpen]=useState(false);
  const L=[
    ...(user ? [
      ['/dashboard','Dashboard'],
      ['/transactions','Transactions'],
      ['/budget','Budget'],
      ['/goals','Goals'],
      ['/reports','Reports']
    ] : []),
    ['/advisor','AI Advisor']
  ];
  return (
    <nav className="navbar navbar-dark sticky-top px-3" style={{background:'rgba(14,26,58,.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
      <Link to="/" className="navbar-brand fw-bold fs-4"><span className="grad">FinWise</span></Link>
      <button className="btn btn-outline-light d-lg-none" onClick={()=>setOpen(!open)}>☰</button>
      <div className={`${open?'d-flex':'d-none'} d-lg-flex flex-column flex-lg-row gap-2 align-items-lg-center ms-lg-auto w-100 w-lg-auto`} style={{flex:'0 1 auto'}} onClick={()=>setOpen(false)}>
        {L.map(([to,l])=><NavLink key={to} to={to} className={({isActive})=>'nav-link px-2 '+(isActive?'text-warning fw-bold':'text-light')}>{l}</NavLink>)}
        {user ? (
          <button className="btn btn-sm btn-outline-warning ms-lg-2" onClick={logout}>Log out ({user.name || user.id})</button>
        ) : (
          <Link to="/auth" className="btn btn-saffron btn-sm ms-lg-2">Get started</Link>
        )}
      </div>
    </nav>
  );
}

function Home(){
  const{user}=useC();
  const sc=[['Salaried professional','Spot overspending and get a monthly plan with savings targets.'],['College student','Stretch a limited allowance across needs and wants.'],['Freelancer','Plan around uneven income and build an emergency fund.'],['Household manager','Track shared groceries, utilities, education and healthcare.']];
  return (
    <Page>
      <motion.h1 className="display-3 fw-bold" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}}>Your money, <span className="grad">planned in rupees</span>.</motion.h1>
      <p className="lead text-slate-300 col-lg-7 my-3">Log income and expenses, get an AI-made budget, track savings goals and ask our advisor anything about SIPs, mutual funds, tax or loans.</p>
      <div className="d-flex gap-3 mt-4">
        <Link to={user?'/dashboard':'/auth'} className="btn btn-saffron btn-lg">{user?'Open dashboard':'Create free account'}</Link>
        <Link to="/advisor" className="btn btn-outline-light btn-lg">Ask AI Advisor</Link>
      </div>
      <div className="row g-3 my-5 text-center">{[['Users get a fresh ID',100,'%'],['Categories tracked',9,''],['Monthly reports',12,'']].map(([l,n,s],i)=>
        <div key={l} className="col-md-4"><Card i={i}><div className="display-5 fw-bold text-warning"><Count to={n} suf={s}/></div><div className="text-slate-300 mt-1">{l}</div></Card></div>)}</div>
      <h3 className="mb-3">Built for how you earn and spend</h3>
      <div className="row g-3">{sc.map(([t,d],i)=><div key={t} className="col-md-6 col-lg-3"><Card i={i} className="h-100"><h5>{t}</h5><p className="text-slate-300 mb-0">{d}</p></Card></div>)}</div>
    </Page>
  );
}

function Auth(){
  const{login}=useC();const nav=useNavigate();const[reg,setReg]=useState(true);const[f,setF]=useState({role:'Salaried',name:'',email:'',password:''});const[err,setErr]=useState('');
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const go=async e=>{e.preventDefault();try{const u=await api(reg?'/register':'/login',{method:'POST',body:f});login(u);nav('/dashboard')}catch(x){setErr(x.message)}};
  return (
    <Page>
      <Card className="mx-auto" style={{maxWidth:440}}>
        <form onSubmit={go} className="d-grid gap-3">
          <h3>{reg?'Create your account':'Welcome back'}</h3>
          {reg&&<>
            <input className="form-control" placeholder="Full name" value={f.name} onChange={set('name')} required/>
            <select className="form-select" value={f.role} onChange={set('role')}>{['Salaried','Student','Freelancer','Household'].map(r=><option key={r}>{r}</option>)}</select>
          </>}
          <input className="form-control" type="email" placeholder="Email" value={f.email} onChange={set('email')} required/>
          <input className="form-control" type="password" placeholder="Password" value={f.password} onChange={set('password')} required/>
          {err&&<div className="text-danger small">{err}</div>}
          <button className="btn btn-saffron">{reg?'Create account':'Log in'}</button>
          <button type="button" className="btn btn-link text-warning p-0" onClick={()=>{setReg(!reg);setErr('')}}>{reg?'Already registered? Log in':'New here? Create an account'}</button>
        </form>
      </Card>
    </Page>
  );
}

function Dash(){
  const{user,tx}=useC();const s=stats(tx);const data=Object.entries(s.by).map(([name,value])=>({name,value}));
  return (
    <Page>
      <h2>Namaste, <span className="grad">{user?.name || 'User'}</span></h2>
      <p className="text-slate-300">Your ID: {user?.id} &bull; Role: {user?.role}</p>
      <div className="row g-3 my-3">{[['Income',inr(s.inc),'#22a559'],['Expenses',inr(s.exp),'#fb7185'],['Savings',inr(s.sav),'#4c8dff'],['Savings rate',s.rate+'%','#ff9933']].map(([l,v,c],i)=>
        <div key={l} className="col-6 col-lg-3"><Card i={i}><div className="text-slate-300 small">{l} this month</div><div className="fs-3 fw-bold" style={{color:c}}>{v}</div></Card></div>)}</div>
      <Card className="mt-3">
        <h5 className="mb-3">Monthly Expense Breakdown</h5>
        <div style={{height:320}}>{data.length?<ResponsiveContainer><PieChart><Pie data={data} dataKey="value" innerRadius={60} outerRadius={110} paddingAngle={3}>{data.map((_,i)=><Cell key={i} fill={COL[i%COL.length]}/>)}</Pie><Tooltip formatter={inr}/><Legend/></PieChart></ResponsiveContainer>:<Empty/>}</div>
      </Card>
    </Page>
  );
}

function Tx(){
  const{tx,call,load}=useC();const today=new Date().toISOString().slice(0,10);const[f,setF]=useState({type:'expense',category:'Food',amount:'',note:'',date:today});const[err,setErr]=useState('');
  const set=k=>e=>setF({...f,[k]:e.target.value});const opts=f.type==='income'?INCOME_SRC:CATS;
  const add=async e=>{e.preventDefault();try{await call('/tx',{method:'POST',body:f});setF({...f,amount:'',note:''});setErr('');load()}catch(x){setErr(x.message)}};
  return (
    <Page>
      <h2>Transactions</h2>
      <Card>
        <form onSubmit={add} className="row g-2">
          <div className="col-6 col-md-2"><select className="form-select" value={f.type} onChange={e=>setF({...f,type:e.target.value,category:e.target.value==='income'?'Salary':'Food'})}><option value="expense">Expense</option><option value="income">Income</option></select></div>
          <div className="col-6 col-md-2"><select className="form-select" value={f.category} onChange={set('category')}>{opts.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="col-6 col-md-2"><input className="form-control" type="number" placeholder="Amount (₹)" value={f.amount} onChange={set('amount')} required min="1"/></div>
          <div className="col-6 col-md-2"><input className="form-control" type="date" value={f.date} onChange={set('date')}/></div>
          <div className="col-8 col-md-3"><input className="form-control" placeholder="Note (e.g. Lunch, Grocery)" value={f.note} onChange={set('note')}/></div>
          <div className="col-4 col-md-1"><button className="btn btn-saffron w-100">Add</button></div>
        </form>
        {err&&<div className="text-danger mt-2 small">{err}</div>}
      </Card>
      <div className="mt-4 d-grid gap-2">{!tx?.length&&<p className="text-slate-300">Nothing logged yet. Add your first entry above.</p>}
        {[...(tx||[])].sort((a,b)=>b.date.localeCompare(a.date)).map(t=><motion.div layout key={t.id} className="glass px-3 py-2 d-flex align-items-center gap-3" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} whileHover={{scale:1.005}}>
          <span className="badge" style={{background:t.type==='income'?'#22a559':'#e8558a'}}>{t.category}</span><span className="flex-grow-1 text-slate-300">{t.note||'-'} <small className="text-slate-400">({t.date})</small></span>
          <b style={{color:t.type==='income'?'#5eea9b':'#ff8fa3'}}>{t.type==='income'?'+':'-'}{inr(t.amount)}</b>
          <button className="btn btn-sm btn-outline-light" onClick={async()=>{await call('/tx/'+t.id,{method:'DELETE'});load()}}>✕</button>
        </motion.div>)}
      </div>
    </Page>
  );
}

function Budget(){
  const{tx}=useC();const s=stats(tx);const needs=NEEDS.reduce((a,c)=>a+(s.by[c]||0),0);const wants=s.exp-needs;
  const rows=[['Needs (50%)',needs,s.inc*.5,'#4c8dff'],['Wants (30%)',wants,s.inc*.3,'#e8558a'],['Savings (20%)',Math.max(s.sav,0),s.inc*.2,'#22a559']];
  const top=Object.entries(s.by).filter(([c])=>!NEEDS.includes(c)).sort((a,b)=>b[1]-a[1])[0];const tips=[];
  if(!s.inc)tips.push('Add this month\'s income to unlock your personalised plan.');else{
    if(wants>s.inc*.3)tips.push(`Wants are ${inr(wants-s.inc*.3)} over your 30% cap${top?`. Start by trimming ${top[0]} (${inr(top[1])})`:''}.`);
    if(s.sav<s.inc*.2)tips.push(`Aim to save ${inr(s.inc*.2)} a month. Set an auto-SIP right after income arrives.`);
    if(needs>s.inc*.5)tips.push('Needs exceed 50% of income. Review rent and recurring bills.');
    tips.push(`Emergency fund target: ${inr(s.exp*6)} (6 months of expenses).`);
  }
  return (
    <Page>
      <h2>AI Budget Plan</h2>
      <p className="text-slate-300">Based on the 50/30/20 rule applied to your income of {inr(s.inc)} this month.</p>
      <div className="row g-3">{rows.map(([l,v,lim,c],i)=><div key={l} className="col-md-4"><Card i={i}><div className="d-flex justify-content-between"><b>{l}</b><span>{inr(v)} / {inr(lim)}</span></div>
        <div className="progress mt-2" style={{background:'rgba(255,255,255,.1)'}}><motion.div className="progress-bar" style={{background:v>lim&&i<2?'#fb7185':c}} initial={{width:0}} animate={{width:Math.min(100,lim?v/lim*100:0)+'%'}} transition={{duration:1}}/></div></Card></div>)}</div>
      <Card className="mt-4"><h5>Suggestions & Insights</h5><ul className="mb-0">{tips.map(t=><li key={t} className="mb-1">{t}</li>)}</ul></Card>
    </Page>
  );
}

function Goals(){
  const{goals,call,load}=useC();const[f,setF]=useState({name:'',target:''});
  return (
    <Page>
      <h2>Savings Goals</h2>
      <Card>
        <form className="row g-2" onSubmit={async e=>{e.preventDefault();await call('/goals',{method:'POST',body:f});setF({name:'',target:''});load()}}>
          <div className="col-md-6"><input className="form-control" placeholder="Goal (e.g. Emergency fund, New Laptop)" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/></div>
          <div className="col-md-4"><input className="form-control" type="number" placeholder="Target (₹)" value={f.target} onChange={e=>setF({...f,target:e.target.value})} required min="100"/></div>
          <div className="col-md-2"><button className="btn btn-saffron w-100">Add goal</button></div>
        </form>
      </Card>
      <div className="row g-3 mt-2">{!goals?.length&&<p className="text-slate-300">No goals yet. Create one above.</p>}{(goals||[]).map((g,i)=>{const p=Math.min(100,g.saved/g.target*100);return <div key={g.id} className="col-md-6"><Card i={i}>
        <div className="d-flex justify-content-between"><b>{g.name}</b><span>{inr(g.saved)} / {inr(g.target)}</span></div>
        <div className="progress my-2" style={{background:'rgba(255,255,255,.1)'}}><motion.div className="progress-bar" style={{background:'#ff9933'}} initial={{width:0}} animate={{width:p+'%'}} transition={{duration:1}}/></div>
        <div className="d-flex gap-2">{[500,1000,5000].map(a=><button key={a} className="btn btn-sm btn-outline-warning" onClick={async()=>{await call('/goals/'+g.id,{method:'PUT',body:{add:a}});load()}}>+{inr(a)}</button>)}</div></Card></div>})}</div>
    </Page>
  );
}

function Reports(){
  const{tx}=useC();const ms=[...Array(6)].map((_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);const k=d.toISOString().slice(0,7);const s=stats(tx,k);return{m:d.toLocaleString('en-IN',{month:'short'}),Income:s.inc,Expenses:s.exp,Savings:s.sav}});
  const c=ms[5];
  return (
    <Page>
      <h2>Monthly Report</h2>
      <Card>
        <div style={{height:320}}>
          <ResponsiveContainer><BarChart data={ms}><XAxis dataKey="m" stroke="#cbd5f5"/><YAxis stroke="#cbd5f5" tickFormatter={v=>'₹'+v/1000+'k'}/><Tooltip formatter={inr} contentStyle={{background:'#0e1a3a',borderColor:'rgba(255,255,255,.1)'}}/><Legend/>
            <Bar dataKey="Income" fill="#22a559" radius={[6,6,0,0]}/><Bar dataKey="Expenses" fill="#e8558a" radius={[6,6,0,0]}/><Bar dataKey="Savings" fill="#ff9933" radius={[6,6,0,0]}/>
          </BarChart></ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-3">This month you earned <b>{inr(c.Income)}</b>, spent <b>{inr(c.Expenses)}</b> and saved <b>{inr(c.Savings)}</b>{c.Income?` (${Math.round(c.Savings/c.Income*100)}% of income)`:''}.</Card>
    </Page>
  );
}

function Advisor(){
  const{call,user}=useC();
  const initialGreeting = user?.name
    ? `Namaste ${user.name}! I'm your FinWise advisor. Ask me anything about budgeting, SIPs, mutual funds, stocks, FDs, tax saving, insurance, or loans.`
    : `Namaste! I'm your FinWise personal finance advisor. Ask me anything about budgeting, SIPs, mutual funds, stocks, FDs, tax saving, insurance, or loans.`;

  const[msgs,setMsgs]=useState([{role:'assistant',content:initialGreeting}]);
  const[q,setQ]=useState('');
  const[busy,setBusy]=useState(false);
  const end=useRef();

  useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[msgs,busy]);

  const send=async t=>{
    const promptText = (t || q).trim();
    if(!promptText||busy)return;
    const next=[...msgs,{role:'user',content:promptText}];
    setMsgs(next);
    setQ('');
    setBusy(true);
    try{
      const r=await call('/chat',{method:'POST',body:{messages:next.map(m=>({role:m.role,content:m.content}))}});
      setMsgs([...next,{role:'assistant',content:r.reply}]);
    }catch(e){
      setMsgs([...next,{role:'assistant',content:e.message || 'Unable to connect to advisor server.'}]);
    }
    setBusy(false);
  };

  return (
    <Page>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>AI Financial Advisor</h2>
          <p className="text-slate-300 mb-0">Powered by LLM & Indian Financial Rules</p>
        </div>
        {!user && (
          <Link to="/auth" className="btn btn-sm btn-outline-warning">Log in for Personalized Advice</Link>
        )}
      </div>

      <Card>
        <div style={{height:420,overflowY:'auto'}} className="d-grid gap-3 align-content-start p-2">
          {msgs.map((m,i)=>(
            <motion.div
              key={i}
              initial={{opacity:0,y:10}}
              animate={{opacity:1,y:0}}
              className={'p-3 rounded-4 '+(m.role==='user'?'ms-auto':'me-auto')}
              style={{
                maxWidth:'85%',
                whiteSpace:'pre-wrap',
                background:m.role==='user'?'#ff9933':'rgba(255,255,255,.08)',
                color:m.role==='user'?'#1a1200':'#fff',
                border:m.role==='user'?'none':'1px solid rgba(255,255,255,.1)'
              }}
            >
              {m.content}
            </motion.div>
          ))}
          {busy&&(
            <div className="p-3 me-auto glass rounded-4 d-flex align-items-center gap-2">
              <span className="dot"/> <span className="dot"/> <span className="dot"/>
              <small className="text-slate-300 ms-2">FinWise Advisor is thinking...</small>
            </div>
          )}
          <div ref={end}/>
        </div>

        <div className="d-flex flex-wrap gap-2 my-3">
          {['Best mutual funds for beginners?','How to start a SIP of ₹5,000?','How to save tax under 80C?','How big should my emergency fund be?'].map(s=>(
            <button key={s} type="button" className="btn btn-sm btn-outline-light" onClick={()=>send(s)} disabled={busy}>{s}</button>
          ))}
        </div>

        <form className="d-flex gap-2" onSubmit={e=>{e.preventDefault();send(q)}}>
          <input className="form-control" placeholder="Ask any money question (e.g. SIP, Tax, Emergency Fund...)" value={q} onChange={e=>setQ(e.target.value)} disabled={busy}/>
          <button className="btn btn-saffron px-4" disabled={busy || !q.trim()}>Send</button>
        </form>
      </Card>
    </Page>
  );
}

const parseUser=()=>{
  try{
    const v=localStorage.getItem('fw');
    return v&&v!=='undefined'&&v!=='null'?JSON.parse(v):null;
  }catch{
    return null;
  }
};

export default function App(){
  const[user,setUser]=useState(parseUser);
  const[tx,setTx]=useState([]);
  const[goals,setGoals]=useState([]);

  const call=(p,o)=>api(p,o,user);
  const load=async()=>{
    if(!user)return;
    try{
      setTx(await call('/tx'));
      setGoals(await call('/goals'));
    }catch(err){
      if(err.message?.includes('log in')) logout();
    }
  };

  useEffect(()=>{load()},[user]);

  const login=u=>{
    localStorage.setItem('fw',JSON.stringify(u));
    setUser(u);
  };

  const logout=()=>{
    localStorage.removeItem('fw');
    setUser(null);
    setTx([]);
    setGoals([]);
  };

  const P=({c})=>user?c:<Navigate to="/auth"/>;

  return (
    <ErrorBoundary>
      <Ctx.Provider value={{user,tx,goals,call,load,login,logout}}>
        <BrowserRouter>
          <div className="blob" style={{width:420,height:420,background:'#ff9933',top:-100,left:-100}}/>
          <div className="blob" style={{width:480,height:480,background:'#22a559',bottom:-150,right:-120,animationDelay:'-5s'}}/>
          <Nav/>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/auth" element={user?<Navigate to="/dashboard"/>:<Auth/>}/>
            <Route path="/dashboard" element={<P c={<Dash/>}/>}/>
            <Route path="/transactions" element={<P c={<Tx/>}/>}/>
            <Route path="/budget" element={<P c={<Budget/>}/>}/>
            <Route path="/goals" element={<P c={<Goals/>}/>}/>
            <Route path="/reports" element={<P c={<Reports/>}/>}/>
            <Route path="/advisor" element={<Advisor/>}/>
          </Routes>
        </BrowserRouter>
      </Ctx.Provider>
    </ErrorBoundary>
  );
}


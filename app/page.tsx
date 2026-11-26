'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://vtpdvzhqhfaffyhmqasg.supabase.co', 'sb_publishable_N2_oxVpc1z4rUZTcSFZoKw_PKEyNGVz', { auth: { persistSession: true, autoRefreshToken: true } });
const ADMIN_EMAIL = 'omar.magico66@gmail.com';

const systems = ['طفايات الحريق','صناديق الحريق','كشافات الطوارئ','نظام الإنذار المبكر','الرش الآلي','نظام الغاز FM 200','نظام ثاني أكسيد الكربون CO2','مضخة الحريق','المحابس والردادات','نظام الإطفاء في المطابخ','شبكة إطفاء الحريق الجافة','شبكة إطفاء الحريق الرطبة'];
type Status = 'سليم'|'في عطل'|'غير موجود';
type Result = {status:Status;fault:string;photo:string;video:string};
const empty = ():Result => ({status:'سليم',fault:'',photo:'',video:''});

export default function Home() {
 const [role,setRole]=useState<'tech'|'admin'>('admin');
 const [technician,setTechnician]=useState('عثمان أبو ديب');
 const [password,setPassword]=useState('');
 const [entered,setEntered]=useState(false);
 const [authLoading,setAuthLoading]=useState(true);
 const [loginLoading,setLoginLoading]=useState(false);
 const [authError,setAuthError]=useState('');
 const [adminName,setAdminName]=useState('');
 const [screen,setScreen]=useState<'home'|'visit'|'history'|'account'>('home');
 const [client,setClient]=useState('');
 const [site,setSite]=useState('');
 const [contact,setContact]=useState('');
 const [phone,setPhone]=useState('');
 const [results,setResults]=useState<Record<string,Result>>(()=>Object.fromEntries(systems.map(s=>[s,empty()])));
 const [extTotal,setExtTotal]=useState('');
 const [refill,setRefill]=useState('لا');
 const [refillCount,setRefillCount]=useState('');
 const [gps,setGps]=useState('');
 const [coords,setCoords]=useState('');
 const [done,setDone]=useState(false);
 const [visitCode,setVisitCode]=useState('');
 const [history,setHistory]=useState<string[]>([]);
 const [notice,setNotice]=useState('');

 useEffect(()=>{let live=true; supabase.auth.getSession().then(async ({data})=>{if(!live)return; if(data.session){const {data:p}=await supabase.from('user_profiles').select('full_name,role,account_status').eq('id',data.session.user.id).maybeSingle(); if(live&&p?.role==='admin'&&p.account_status==='active'){setAdminName(p.full_name||'المدير');setEntered(true);} else if(live){await supabase.auth.signOut();setAuthError('الحساب غير مفعّل كمدير.');}} if(live)setAuthLoading(false);}).catch(()=>{if(live){setAuthError('تعذر الاتصال بخدمة تسجيل الدخول.');setAuthLoading(false);}}); return ()=>{live=false;};},[]);
 async function login(){setAuthError('');if(!password){setAuthError('اكتب كلمة المرور أولاً.');return;}setLoginLoading(true);try{const {data,error}=await supabase.auth.signInWithPassword({email:ADMIN_EMAIL,password});if(error)throw error;if(!data.user)throw new Error('تعذر التحقق من الحساب.');const {data:p,error:pe}=await supabase.from('user_profiles').select('full_name,role,account_status').eq('id',data.user.id).single();if(pe||p?.role!=='admin'||p?.account_status!=='active'){await supabase.auth.signOut();throw new Error('الحساب لا يملك صلاحية المدير أو أنه موقوف.');}setAdminName(p.full_name||'المدير');setRole('admin');setEntered(true);setPassword('');}catch(e){setAuthError(e instanceof Error?e.message:'حدث خطأ أثناء تسجيل الدخول.');}finally{setLoginLoading(false);}}
 async function logout(){await supabase.auth.signOut();setEntered(false);setScreen('home');setPassword('');}
 function updateSystem(name:string, patch:Partial<Result>) { setResults(prev=>({...prev,[name]:{...prev[name],...patch}})); }
 function getLocation() {
  setGps('جارٍ طلب إذن الموقع...');
  if (!navigator.geolocation) { setGps('المتصفح لا يدعم تحديد الموقع.'); return; }
  navigator.geolocation.getCurrentPosition(
   p=>{setCoords(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`);setGps('تم تحديد الموقع بنجاح');},
   e=>setGps(e.code===1?'تم رفض إذن الموقع. فعّل GPS واسمح للمتصفح بالوصول للموقع.':'تعذر تحديد الموقع. تأكد من تشغيل GPS والإنترنت ثم حاول مجدداً.'),
   {enableHighAccuracy:true,timeout:15000,maximumAge:0}
  );
 }
 function startVisit(){setScreen('visit');setDone(false);setNotice('');setCoords('');setGps('');}
 function finishVisit(){
  const missing = systems.find(s=>results[s].status==='في عطل'&&!results[s].fault.trim());
  if(!client.trim()||!site.trim()){setNotice('من فضلك أدخل اسم الشركة واسم الموقع.');return;}
  if(missing){setNotice(`اكتب وصف العطل في نظام: ${missing}`);return;}
  if(!coords){setNotice('يجب تحديد موقع الزيارة GPS قبل إنهائها.');return;}
  if(refill==='نعم' && (!refillCount || Number(refillCount)<0)){setNotice('أدخل عدد الطفايات التي تحتاج تعبئة.');return;}
  const code=`KW-${new Date().getFullYear()}-DEMO-${String(history.length+1).padStart(3,'0')}`;
  setVisitCode(code);setHistory(prev=>[code,...prev]);setDone(true);setNotice('');
 }
 if(authLoading) return <main className="page"><Header/><section className="hero"><div className="login"><h2>جارٍ التحقق من الجلسة…</h2><p>يرجى الانتظار</p></div></section><Footer/></main>;
 if(!entered) return <main className="page"><Header/><section className="hero"><div className="intro"><small className="eyebrow">منصة الكوادر الذكية</small><h1>إدارة الزيارات<br/><em>بسهولة واحترافية</em></h1><p>منصة موحدة لتنظيم أعمال الصيانة الدورية ومتابعة فرق العمل.</p></div><div className="login"><div className="symbol">⌁</div><h2>تسجيل دخول الإدارة</h2><p>أدخل كلمة مرور حساب المدير</p><label>كلمة المرور<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')login();}} placeholder="أدخل كلمة المرور"/></label>{authError&&<div className="error" role="alert">{authError}</div>}<button className="primary" disabled={loginLoading} onClick={login}>{loginLoading?'جارٍ تسجيل الدخول…':'دخول آمن ←'}</button><small className="notice">الدخول مرتبط بحساب المدير المعتمد. تفعيل حسابات الفنيين عبر QR سيُضاف لاحقاً.</small></div></section><Footer/></main>;

 return <main className="page"><Header/><section className="dashboard">
 <div className="welcome"><div><small className="eyebrow">{role==='tech'?'لوحة الفني':'لوحة الإدارة'}</small><h1>{screen==='visit'?'تسجيل زيارة جديدة':screen==='history'?'زياراتي السابقة':screen==='account'?'حسابي':'أهلاً بك في الكوادر'}</h1><p>{adminName||'إدارة النظام'}</p></div><button className="logout" onClick={logout}>تسجيل الخروج</button></div>
 <div className="panel"><h2>مرحباً بك في لوحة الإدارة</h2><p>تم التحقق من حساب المدير وربطه بنظام تسجيل الدخول.</p><p className="muted">إدارة الفنيين والزيارات والعقود ما زالت قيد التجهيز. لن نعرض بيانات تجريبية على أنها بيانات حقيقية.</p><div className="history"><b>حالة المصادقة</b><span className="pill">متصل</span></div></div> </section><Footer/></main>;
}
function Header(){return <header><div className="mark">K</div><div><b>AL KAWADER <i>VII</i></b><small>مؤسسة الكوادر المتخصصة لأجهزة السلامة</small></div><span className="header-note">نظام إدارة الصيانة والزيارات</span></header>}
function Footer(){return <footer>© مؤسسة الكوادر المتخصصة لأجهزة السلامة <span>AL KAWADER VII</span></footer>}

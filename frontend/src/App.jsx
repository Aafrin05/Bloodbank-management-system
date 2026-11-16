import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bell, Droplet, LayoutDashboard, Users, ClipboardList, Boxes, LogOut,
  Search, Plus, Pencil, Trash2, X, Menu, ArrowUpRight, HeartPulse, CheckCircle2,
  Clock3, AlertCircle, ChevronDown, RefreshCw, ShieldCheck
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost/blood-bank/backend/api.php';
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const blankDonor = { name:'', age:'18', gender:'Female', blood_group:'O+', phone:'', email:'', city:'', last_donation_date:'' };
const blankRequest = { requester_name:'', hospital:'', blood_group:'O+', units:'1', contact_phone:'', urgency:'Normal', notes:'' };

async function api(action, { method='GET', body, query='' } = {}) {
  const response = await fetch(`${API}?action=${encodeURIComponent(action)}${query}`, {
    method, credentials:'include', headers: body ? { 'Content-Type':'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function App() {
  const [user, setUser] = useState(undefined);
  const [page, setPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [donors, setDonors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [donorModal, setDonorModal] = useState(null);
  const [requestModal, setRequestModal] = useState(false);
  const [login, setLogin] = useState({ email:'admin@bloodbank.local', password:'Admin@123' });

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
  const loadAll = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [d, don, inv, req] = await Promise.all([
        api('dashboard'), api('donors'), api('inventory'), api('requests')
      ]);
      setDashboard(d); setDonors(don.donors); setInventory(inv.inventory); setRequests(req.requests);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    api('me').then(({ user }) => { setUser(user || null); }).catch(() => setUser(null));
  }, []);
  useEffect(() => { if (user) loadAll(); }, [user, loadAll]);

  const doLogin = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { const result = await api('login', { method:'POST', body:login }); setUser(result.user); notify('Welcome back!'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    try { await api('logout', { method:'POST' }); } catch {}
    setUser(null); setDashboard(null); setPage('Dashboard');
  };

  const saveDonor = async (e) => {
    e.preventDefault(); setError('');
    try {
      const editing = Boolean(donorModal?.id);
      await api('donors', { method:editing ? 'PUT':'POST', body: { ...donorModal, age:Number(donorModal.age) } });
      setDonorModal(null); await loadAll(); notify(editing ? 'Donor updated successfully.' : 'Donor registered successfully.');
    } catch (e) { setError(e.message); }
  };
  const deleteDonor = async (id) => {
    if (!confirm('Delete this donor record?')) return;
    try { await api('donors', { method:'DELETE', query:`&id=${id}` }); await loadAll(); notify('Donor record deleted.'); }
    catch (e) { setError(e.message); }
  };
  const saveRequest = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api('requests', { method:'POST', body:{ ...requestModal, units:Number(requestModal.units) } });
      setRequestModal(false); await loadAll(); notify('Blood request created.');
    } catch (e) { setError(e.message); }
  };
  const updateRequest = async (id, status) => {
    try { await api('requests', { method:'PUT', body:{ id:Number(id), status } }); await loadAll(); notify('Request status updated.'); }
    catch (e) { setError(e.message); }
  };
  const deleteRequest = async (id) => {
    if (!confirm('Delete this blood request?')) return;
    try { await api('requests', { method:'DELETE', query:`&id=${id}` }); await loadAll(); notify('Request deleted.'); }
    catch (e) { setError(e.message); }
  };
  const updateUnits = async (group, units) => {
    try { await api('inventory', { method:'PUT', body:{ blood_group:group, units:Number(units) } }); await loadAll(); notify(`${group} inventory updated.`); }
    catch (e) { setError(e.message); }
  };

  const nav = [
    { name:'Dashboard', icon:LayoutDashboard },
    { name:'Donors', icon:Users },
    { name:'Blood Inventory', icon:Boxes },
    { name:'Blood Requests', icon:ClipboardList }
  ];
  const filteredDonors = useMemo(() => donors.filter(d => [d.name,d.phone,d.blood_group,d.city].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))), [donors,search]);
  const filteredRequests = useMemo(() => requests.filter(r => [r.requester_name,r.hospital,r.blood_group,r.status].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))), [requests,search]);

  if (user === undefined) return <div className="loading-screen"><div className="brand-mark"><Droplet /></div><p>Preparing your workspace…</p></div>;
  if (!user) return <main className="login-page">
    <section className="login-art">
      <div className="login-brand"><span className="brand-mark"><Droplet size={24} fill="currentColor" /></span><span>LifeFlow</span></div>
      <div className="art-copy"><span className="eyebrow">EVERY DROP COUNTS</span><h1>Make every donation<br/>a chance at life.</h1><p>A smarter, simpler way to manage blood donors, inventory, and requests.</p>
        <div className="login-stat-row"><div><strong>8</strong><span>Blood groups</span></div><div><strong>24/7</strong><span>Care coordination</span></div></div>
      </div>
      <div className="art-bottom"><HeartPulse size={18}/> Compassion powered by better coordination.</div>
    </section>
    <section className="login-panel"><form className="login-form" onSubmit={doLogin}>
      <div className="mobile-brand"><span className="brand-mark"><Droplet size={22}/></span> LifeFlow</div>
      <span className="eyebrow red">ADMIN PORTAL</span><h2>Welcome back</h2><p className="muted">Sign in to access your blood bank dashboard.</p>
      {error && <div className="alert error"><AlertCircle size={17}/>{error}</div>}
      <label>Email address<input type="email" required autoComplete="username" value={login.email} onChange={e=>setLogin({...login,email:e.target.value})} placeholder="admin@bloodbank.local"/></label>
      <label>Password<input type="password" required autoComplete="current-password" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="Enter your password"/></label>
      <button className="btn primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={17}/></button>
      <div className="demo-note"><ShieldCheck size={16}/><span>Demo login: <b>admin@bloodbank.local</b><br/>Password: <b>Admin@123</b></span></div>
      <p className="login-foot">Secure access for authorized staff only.</p>
    </form></section>
  </main>;

  return <div className="app-shell">
    {sidebarOpen && <button aria-label="Close navigation" className="mobile-scrim" onClick={()=>setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen?'open':''}`}>
      <div className="brand"><span className="brand-mark"><Droplet size={23} fill="currentColor"/></span><span>LifeFlow<small>BLOOD BANK SYSTEM</small></span><button className="icon-btn close-sidebar" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div>
      <div className="side-caption">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.name} className={`nav-item ${page===item.name?'active':''}`} onClick={()=>{setPage(item.name);setSearch('');setSidebarOpen(false);setError('');}}><item.icon size={19}/><span>{item.name}</span>{item.name==='Blood Requests' && dashboard?.pending>0 && <span className="nav-count">{dashboard.pending}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="support-card"><div className="support-icon"><HeartPulse size={18}/></div><strong>Saving lives, together.</strong><p>Keep donor records and blood stock up to date.</p></div><div className="profile-row"><div className="avatar">{(user.name||'A').slice(0,1).toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><span>Administrator</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn menu-toggle" onClick={()=>setSidebarOpen(true)}><Menu size={21}/></button><div className="crumb">Workspace <span>/</span> <strong>{page}</strong></div></div><div className="topbar-right"><span className="live-dot"/> <span className="system-status">System operational</span><div className="top-divider"/><button className="icon-btn notification" title="Refresh data" onClick={loadAll}><RefreshCw size={18}/></button><div className="avatar small">{(user.name||'A').slice(0,1).toUpperCase()}</div></div></header>
      <div className="content">
        {error && <div className="alert error global-alert"><AlertCircle size={17}/><span>{error}</span><button className="icon-btn" onClick={()=>setError('')}><X size={16}/></button></div>}
        {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
        {page==='Dashboard' && <DashboardPage dashboard={dashboard} requests={requests} inventory={inventory} setPage={setPage} busy={busy}/>}
        {page==='Donors' && <section>
          <PageHeading eyebrow="DONOR DIRECTORY" title="Donor management" subtitle="Build and maintain a reliable community of blood donors." action={<button className="btn primary" onClick={()=>setDonorModal({...blankDonor})}><Plus size={17}/> Add donor</button>}/>
          <div className="toolbar"><div className="searchbox"><Search size={17}/><input placeholder="Search by name, blood group, phone or city…" value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="result-count">{filteredDonors.length} donors</span></div>
          <div className="panel table-panel"><div className="panel-head"><div><h3>Registered donors</h3><p>Contact and donation details</p></div><span className="soft-tag">{donors.length} total records</span></div>
            {filteredDonors.length ? <div className="table-wrap"><table><thead><tr><th>DONOR</th><th>BLOOD GROUP</th><th>AGE / GENDER</th><th>CONTACT</th><th>CITY</th><th>LAST DONATION</th><th></th></tr></thead><tbody>{filteredDonors.map(d=><tr key={d.id}><td><div className="person-cell"><div className="person-avatar">{d.name?.slice(0,1).toUpperCase()}</div><div><strong>{d.name}</strong><small>Donor ID #{d.id}</small></div></div></td><td><BloodTag group={d.blood_group}/></td><td>{d.age} yrs <small className="subline">{d.gender}</small></td><td><strong className="normal-weight">{d.phone}</strong><small className="subline">{d.email || 'No email'}</small></td><td>{d.city}</td><td>{d.last_donation_date || '—'}</td><td><div className="row-actions"><button className="icon-btn" title="Edit donor" onClick={()=>setDonorModal({...d})}><Pencil size={16}/></button><button className="icon-btn danger-icon" title="Delete donor" onClick={()=>deleteDonor(d.id)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title="No donors found" text={search?'Try a different search term.':'Add your first donor to get started.'}/>}
          </div>
        </section>}
        {page==='Blood Inventory' && <section>
          <PageHeading eyebrow="STOCK CONTROL" title="Blood inventory" subtitle="Monitor available blood units by group and update stock levels." action={<span className="stock-summary"><Droplet size={17}/>{inventory.reduce((s,i)=>s+Number(i.units),0)} units in stock</span>}/>
          <div className="inventory-grid">{inventory.map((item,i)=><InventoryCard key={item.blood_group} item={item} index={i} onSave={updateUnits}/>)}</div>
          <div className="panel inventory-note"><div className="note-icon"><Activity size={21}/></div><div><h3>Inventory management tip</h3><p>Update stock after every verified collection, issue, expiry, or adjustment. Keep all entries aligned with the blood bank's approved records.</p></div></div>
        </section>}
        {page==='Blood Requests' && <section>
          <PageHeading eyebrow="REQUEST CENTER" title="Blood requests" subtitle="Review requests and track each request from submission to completion." action={<button className="btn primary" onClick={()=>setRequestModal(true)}><Plus size={17}/> New request</button>}/>
          <div className="mini-stat-row"><MiniStat label="Total requests" value={requests.length} icon={ClipboardList}/><MiniStat label="Pending review" value={requests.filter(r=>r.status==='Pending').length} icon={Clock3} tone="amber"/><MiniStat label="Critical priority" value={requests.filter(r=>r.urgency==='Critical'&&r.status==='Pending').length} icon={AlertCircle} tone="red"/></div>
          <div className="toolbar"><div className="searchbox"><Search size={17}/><input placeholder="Search requester, hospital, group or status…" value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="result-count">{filteredRequests.length} requests</span></div>
          <div className="panel table-panel"><div className="panel-head"><div><h3>Request register</h3><p>Manage request status and urgency</p></div></div>
            {filteredRequests.length ? <div className="table-wrap"><table><thead><tr><th>REQUESTER / HOSPITAL</th><th>BLOOD GROUP</th><th>UNITS</th><th>URGENCY</th><th>DATE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filteredRequests.map(r=><tr key={r.id}><td><strong>{r.requester_name}</strong><small className="subline">{r.hospital}</small><small className="subline">{r.contact_phone}</small></td><td><BloodTag group={r.blood_group}/></td><td><strong>{r.units} units</strong></td><td><span className={`urgency ${r.urgency.toLowerCase()}`}>{r.urgency}</span></td><td>{new Date(r.created_at.replace(' ','T')).toLocaleDateString()}</td><td><StatusSelect value={r.status} onChange={v=>updateRequest(r.id,v)}/></td><td><button className="icon-btn danger-icon" title="Delete request" onClick={()=>deleteRequest(r.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="No requests found" text={search?'Try a different search term.':'Create a blood request to start tracking it.'}/>}
          </div>
        </section>}
        <footer className="footer"><span>© {new Date().getFullYear()} LifeFlow Blood Bank Management</span><span><span className="live-dot"/> All systems ready</span></footer>
      </div>
    </main>
    {donorModal && <Modal title={donorModal.id?'Edit donor':'Register new donor'} subtitle="Enter accurate donor details for the register." onClose={()=>setDonorModal(null)}><form className="form-grid" onSubmit={saveDonor}>
      <label className="span-2">Full name<input required maxLength="120" value={donorModal.name} onChange={e=>setDonorModal({...donorModal,name:e.target.value})} placeholder="Donor's full name"/></label>
      <label>Age (18–65)<input type="number" min="18" max="65" required value={donorModal.age} onChange={e=>setDonorModal({...donorModal,age:e.target.value})}/></label>
      <label>Gender<select value={donorModal.gender} onChange={e=>setDonorModal({...donorModal,gender:e.target.value})}><option>Female</option><option>Male</option><option>Other</option></select></label>
      <label>Blood group<select value={donorModal.blood_group} onChange={e=>setDonorModal({...donorModal,blood_group:e.target.value})}>{GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
      <label>Phone number<input required maxLength="30" value={donorModal.phone} onChange={e=>setDonorModal({...donorModal,phone:e.target.value})} placeholder="+91…"/></label>
      <label className="span-2">Email address (optional)<input type="email" value={donorModal.email||''} onChange={e=>setDonorModal({...donorModal,email:e.target.value})} placeholder="donor@example.com"/></label>
      <label className="span-2">City<input required maxLength="100" value={donorModal.city} onChange={e=>setDonorModal({...donorModal,city:e.target.value})} placeholder="City or town"/></label>
      <label className="span-2">Last donation date (optional)<input type="date" value={donorModal.last_donation_date||''} onChange={e=>setDonorModal({...donorModal,last_donation_date:e.target.value})}/></label>
      <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={()=>setDonorModal(null)}>Cancel</button><button className="btn primary"><CheckCircle2 size={16}/> Save donor</button></div>
    </form></Modal>}
    {requestModal && <Modal title="Create blood request" subtitle="Record the requester and the blood units needed." onClose={()=>setRequestModal(false)}><form className="form-grid" onSubmit={saveRequest}>
      <label className="span-2">Requester name<input required maxLength="120" value={requestModal.requester_name} onChange={e=>setRequestModal({...requestModal,requester_name:e.target.value})} placeholder="Patient or contact name"/></label>
      <label className="span-2">Hospital / organization<input required maxLength="160" value={requestModal.hospital} onChange={e=>setRequestModal({...requestModal,hospital:e.target.value})} placeholder="Hospital name"/></label>
      <label>Blood group<select value={requestModal.blood_group} onChange={e=>setRequestModal({...requestModal,blood_group:e.target.value})}>{GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
      <label>Units needed<input type="number" min="1" max="1000" required value={requestModal.units} onChange={e=>setRequestModal({...requestModal,units:e.target.value})}/></label>
      <label className="span-2">Contact phone<input required maxLength="30" value={requestModal.contact_phone} onChange={e=>setRequestModal({...requestModal,contact_phone:e.target.value})} placeholder="Contact number"/></label>
      <label>Urgency<select value={requestModal.urgency} onChange={e=>setRequestModal({...requestModal,urgency:e.target.value})}><option>Normal</option><option>Urgent</option><option>Critical</option></select></label>
      <label className="span-2">Notes (optional)<textarea rows="3" maxLength="500" value={requestModal.notes} onChange={e=>setRequestModal({...requestModal,notes:e.target.value})} placeholder="Additional details…"/></label>
      <div className="form-actions span-2"><button type="button" className="btn secondary" onClick={()=>setRequestModal(false)}>Cancel</button><button className="btn primary"><Plus size={16}/> Create request</button></div>
    </form></Modal>}
  </div>;
}

function PageHeading({eyebrow,title,subtitle,action}) { return <div className="page-heading"><div><span className="eyebrow red">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="heading-action">{action}</div>}</div>; }
function BloodTag({group}) { return <span className="blood-tag"><Droplet size={13} fill="currentColor"/>{group}</span>; }
function StatusPill({status}) { return <span className={`status-pill ${status.toLowerCase()}`}><span/>{status}</span>; }
function StatusSelect({value,onChange}) { return <div className="status-select-wrap"><StatusPill status={value}/><select aria-label="Request status" value={value} onChange={e=>onChange(e.target.value)}><option>Pending</option><option>Approved</option><option>Rejected</option><option>Completed</option></select><ChevronDown size={13}/></div>; }
function EmptyState({icon:Icon,title,text}) { return <div className="empty-state"><div className="empty-icon"><Icon size={24}/></div><h3>{title}</h3><p>{text}</p></div>; }
function MiniStat({label,value,icon:Icon,tone=''}) { return <div className="mini-stat"><div className={`mini-icon ${tone}`}><Icon size={18}/></div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function InventoryCard({item,index,onSave}) {
  const [editing,setEditing] = useState(false); const [units,setUnits] = useState(item.units);
  useEffect(()=>setUnits(item.units),[item.units]);
  const level = Number(item.units) < 8 ? 'low' : Number(item.units) < 16 ? 'medium' : 'good';
  return <div className={`inventory-card inventory-${index%4}`}><div className="inv-card-top"><div className="inv-blood-icon"><Droplet size={21} fill="currentColor"/></div><span className={`stock-level ${level}`}>{level==='low'?'Low stock':level==='medium'?'Moderate':'In stock'}</span></div><div className="inv-group">{item.blood_group}<span>Blood group</span></div><div className="units-line"><strong>{item.units}</strong><span>units available</span></div><div className="stock-bar"><span style={{width:`${Math.min(100,Number(item.units)/40*100)}%`}}/></div>
    {editing ? <div className="inv-edit"><input aria-label={`Units for ${item.blood_group}`} type="number" min="0" max="100000" value={units} onChange={e=>setUnits(e.target.value)}/><button className="btn primary compact" onClick={()=>{onSave(item.blood_group,units);setEditing(false);}}>Save</button><button className="icon-btn" onClick={()=>{setUnits(item.units);setEditing(false);}}><X size={16}/></button></div> : <button className="edit-stock" onClick={()=>setEditing(true)}><Pencil size={14}/> Adjust stock</button>}
  </div>;
}
function DashboardPage({dashboard,requests,inventory,setPage,busy}) {
  const stats = [
    {label:'Registered donors',value:dashboard?.donors??'—',sub:'Active donor records',icon:Users,tone:'red'},
    {label:'Available blood units',value:dashboard?.units??'—',sub:'Across all blood groups',icon:Droplet,tone:'pink'},
    {label:'Pending requests',value:dashboard?.pending??'—',sub:'Awaiting review',icon:Clock3,tone:'amber'},
    {label:'Total requests',value:dashboard?.requests??'—',sub:'All-time request records',icon:ClipboardList,tone:'blue'}
  ];
  return <section>
    <PageHeading eyebrow="OVERVIEW" title="Good day, Administrator 👋" subtitle="Here’s what’s happening at your blood bank today." action={<button className="btn secondary" onClick={()=>window.location.reload()}><RefreshCw size={16}/> Refresh overview</button>}/>
    <div className="welcome-banner"><div className="welcome-symbol"><HeartPulse size={30}/></div><div><span>YOUR IMPACT STARTS HERE</span><h2>Every unit can make a difference.</h2><p>Keep your inventory current and requests moving forward.</p></div><div className="banner-drop"><Droplet size={86} fill="currentColor"/></div></div>
    <div className="stat-grid">{stats.map((s,i)=><div className="stat-card" key={s.label}><div className={`stat-icon ${s.tone}`}><s.icon size={21}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{busy?'…':s.value}</div><div className="stat-foot">{s.sub}</div><span className="stat-decoration"><s.icon size={56}/></span></div>)}</div>
    <div className="dashboard-grid">
      <div className="panel stock-panel"><div className="panel-head"><div><h3>Blood stock overview</h3><p>Current available units by blood group</p></div><button className="text-link" onClick={()=>setPage('Blood Inventory')}>View inventory <ArrowUpRight size={15}/></button></div>
        <div className="stock-list">{inventory.map(i=><div className="stock-row" key={i.blood_group}><BloodTag group={i.blood_group}/><div className="stock-track"><span style={{width:`${Math.min(100,Number(i.units)/40*100)}%`}}/></div><strong>{i.units}</strong><span className="stock-units">units</span></div>)}</div>
        <div className="stock-legend"><span><i className="legend-dot good-dot"/> Healthy stock</span><span><i className="legend-dot low-dot"/> Low stock (&lt; 8 units)</span></div>
      </div>
      <div className="panel recent-panel"><div className="panel-head"><div><h3>Recent requests</h3><p>Latest activity in your center</p></div><button className="text-link" onClick={()=>setPage('Blood Requests')}>View all <ArrowUpRight size={15}/></button></div>
        {requests.length ? <div className="recent-list">{requests.slice(0,5).map(r=><div className="recent-item" key={r.id}><div className="recent-icon"><Droplet size={17}/></div><div className="recent-info"><strong>{r.requester_name}</strong><span>{r.hospital}</span><small>{r.blood_group} · {r.units} unit{Number(r.units)===1?'':'s'}</small></div><StatusPill status={r.status}/></div>)}</div> : <EmptyState icon={ClipboardList} title="No requests yet" text="New blood requests will appear here."/>}
      </div>
    </div>
    <div className="bottom-callout"><div className="callout-icon"><ShieldCheck size={20}/></div><div><strong>Keep records accurate and secure</strong><p>Only authorized staff should update donor records, stock levels, and request status.</p></div><span className="secure-label"><span className="live-dot"/> Protected workspace</span></div>
  </section>;
}
function Modal({title,subtitle,onClose,children}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>{children}</div></div>; }

export default App;

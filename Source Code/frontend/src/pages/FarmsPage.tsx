import { FormEvent, useEffect, useState } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

type Farm={id:number;name:string;location_name:string;country:string;district:string;area_hectares:string;soil_type:string;water_source:string;latitude:string|null;longitude:string|null;notes:string}
const empty={name:'',location_name:'',country:'Belize',district:'',area_hectares:'',soil_type:'',water_source:'',latitude:'',longitude:'',notes:''}

export default function FarmsPage(){
  const [farms,setFarms]=useState<Farm[]>([])
  const [form,setForm]=useState(empty)
  const [loading,setLoading]=useState(true)
  const [message,setMessage]=useState('')
  const {user,logout}=useAuth()

  const load=async()=>{setLoading(true); try{const {data}=await api.get('/farms/'); setFarms(data.results??data)} finally{setLoading(false)}}
  useEffect(()=>{load()},[])

  const locate=()=>{
    if(!navigator.geolocation){setMessage('Geolocation is not supported by this browser.');return}
    navigator.geolocation.getCurrentPosition(
      pos=>setForm(v=>({...v,latitude:pos.coords.latitude.toFixed(7),longitude:pos.coords.longitude.toFixed(7)})),
      ()=>setMessage('Location access was denied or unavailable.'),
      {enableHighAccuracy:true,timeout:10000}
    )
  }

  async function save(e:FormEvent){
    e.preventDefault(); setMessage('')
    await api.post('/farms/', {...form, area_hectares:Number(form.area_hectares), latitude:form.latitude?Number(form.latitude):null, longitude:form.longitude?Number(form.longitude):null})
    setForm(empty); setMessage('Farm created successfully.'); await load()
  }

  async function remove(id:number){if(confirm('Delete this farm?')){await api.delete(`/farms/${id}/`); await load()}}

  return <div className="app-shell">
    <aside className="sidebar"><div className="logo">CARDI</div><nav><a className="active">Farms</a><a>Crop Knowledge</a><a>Planning</a><a>Analytics</a></nav></aside>
    <main>
      <header className="topbar"><div><strong>{user?.first_name||user?.email}</strong><span>{user?.role}</span></div><button className="ghost" onClick={logout}>Logout</button></header>
      <section className="page-head"><div><p className="eyebrow">Farm Management</p><h1>My Farms</h1><p className="muted">Register farms, acreage, soil, water source, and GPS location.</p></div></section>
      <div className="grid two">
        <form className="card" onSubmit={save}>
          <h3><Plus size={18}/> Register Farm</h3>
          <div className="form-grid">
            <label>Farm name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
            <label>Location name<input value={form.location_name} onChange={e=>setForm({...form,location_name:e.target.value})}/></label>
            <label>Country<input value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></label>
            <label>District<input value={form.district} onChange={e=>setForm({...form,district:e.target.value})}/></label>
            <label>Area (hectares)<input type="number" step="0.01" value={form.area_hectares} onChange={e=>setForm({...form,area_hectares:e.target.value})}/></label>
            <label>Soil type<input value={form.soil_type} onChange={e=>setForm({...form,soil_type:e.target.value})}/></label>
            <label>Water source<input value={form.water_source} onChange={e=>setForm({...form,water_source:e.target.value})}/></label>
          </div>
          <div className="location-box">
            <div><MapPin size={18}/><strong>GPS coordinates</strong></div>
            <button type="button" className="secondary" onClick={locate}>Use my current location</button>
            <div className="form-grid">
              <label>Latitude<input value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label>
              <label>Longitude<input value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label>
            </div>
          </div>
          <label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
          {message&&<div className="alert">{message}</div>}
          <button>Save farm</button>
        </form>

        <section className="card">
          <h3>Registered Farms</h3>
          {loading?<div className="skeleton">Loading…</div>:farms.length===0?<div className="empty">No farms registered yet.</div>:
          <div className="farm-list">{farms.map(f=><article key={f.id} className="farm-item"><div><h4>{f.name}</h4><p>{f.location_name||f.district||f.country}</p><small>{f.area_hectares} ha · {f.soil_type||'Soil not set'} · {f.water_source||'Water not set'}</small>{f.latitude&&<small>GPS: {f.latitude}, {f.longitude}</small>}</div><button className="icon danger" onClick={()=>remove(f.id)} aria-label="Delete farm"><Trash2 size={17}/></button></article>)}</div>}
        </section>
      </div>
    </main>
  </div>
}

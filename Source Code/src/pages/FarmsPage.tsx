import { FormEvent, useEffect, useMemo, useState } from "react";
import FarmMap from "../components/FarmMap";
import {
  type Farm,
  type FarmInput,
  createFarm,
  deleteFarm,
  listFarmMarkers,
  listFarms,
  updateFarm,
  type FarmMarker,
} from "../services/farms";

const emptyForm: FarmInput = {
  name: "",
  location_name: "",
  country: "Belize",
  district: "",
  area_hectares: 0,
  soil_type: "",
  water_source: "",
  latitude: null,
  longitude: null,
  notes: "",
};

export default function MyFarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [markers, setMarkers] = useState<FarmMarker[]>([]);
  const [form, setForm] = useState<FarmInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "manage">("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [farmData, markerData] = await Promise.all([listFarms(), listFarmMarkers()]);
      setFarms(farmData);
      setMarkers(markerData);
    } catch {
      setError("Farm information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const totalArea = useMemo(
    () => farms.reduce((sum, farm) => sum + Number(farm.area_hectares || 0), 0),
    [farms],
  );

  function updateField<K extends keyof FarmInput>(key: K, value: FarmInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function useCurrentLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("This browser does not support geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField("latitude", Number(position.coords.latitude.toFixed(7)));
        updateField("longitude", Number(position.coords.longitude.toFixed(7)));
        setMessage("Current GPS coordinates added to the farm form.");
      },
      () => setError("Location access was denied or unavailable. Enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function startEdit(farm: Farm) {
    setEditingId(farm.id);
    setForm({
      name: farm.name,
      location_name: farm.location_name,
      country: farm.country,
      district: farm.district,
      area_hectares: Number(farm.area_hectares),
      soil_type: farm.soil_type,
      water_source: farm.water_source,
      latitude: farm.latitude === null ? null : Number(farm.latitude),
      longitude: farm.longitude === null ? null : Number(farm.longitude),
      notes: farm.notes,
    });
    setActiveTab("manage");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editingId) {
        await updateFarm(editingId, form);
        setMessage("Farm updated successfully.");
      } else {
        await createFarm(form);
        setMessage("Farm registered successfully.");
      }
      resetForm();
      await refresh();
      setActiveTab("overview");
    } catch {
      setError("The farm could not be saved. Check the required fields and coordinates.");
    } finally {
      setSaving(false);
    }
  }

  async function removeFarm(id: number) {
    if (!window.confirm("Delete this farm? This action cannot be undone.")) return;
    try {
      await deleteFarm(id);
      setMessage("Farm deleted.");
      await refresh();
    } catch {
      setError("The farm could not be deleted.");
    }
  }

  return (
    <main className="page-shell">
      <section className="page-heading-row">
        <div><span className="eyebrow">Farm Management</span><h1>My Farms</h1><p>Register farms, capture GPS coordinates, and review them on OpenStreetMap.</p></div>
        <button className="button primary" onClick={() => { resetForm(); setActiveTab("manage"); }}>+ Register farm</button>
      </section>

      <div className="tab-bar" role="tablist" aria-label="Farm page sections">
        {(["overview", "map", "manage"] as const).map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab === "overview" ? "Overview" : tab === "map" ? "GIS Map" : editingId ? "Edit Farm" : "Register Farm"}
          </button>
        ))}
      </div>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      {activeTab === "overview" && (
        <>
          <section className="kpi-grid">
            <article><span>Registered farms</span><strong>{farms.length}</strong></article>
            <article><span>Total land</span><strong>{totalArea.toFixed(2)} ha</strong></article>
            <article><span>Mapped farms</span><strong>{markers.length}</strong></article>
          </section>
          {loading ? <div className="state-card">Loading farms...</div> : farms.length === 0 ? (
            <div className="state-card"><h2>No farms registered</h2><p>Register your first farm and use GPS to place it on the map.</p></div>
          ) : (
            <section className="farm-list">
              {farms.map((farm) => (
                <article className="farm-card" key={farm.id}>
                  <div><h2>{farm.name}</h2><p>{farm.location_name || `${farm.district}, ${farm.country}`}</p></div>
                  <dl>
                    <div><dt>Area</dt><dd>{farm.area_hectares} ha</dd></div>
                    <div><dt>Soil</dt><dd>{farm.soil_type || "Not recorded"}</dd></div>
                    <div><dt>Water</dt><dd>{farm.water_source || "Not recorded"}</dd></div>
                    <div><dt>GPS</dt><dd>{farm.latitude && farm.longitude ? `${farm.latitude}, ${farm.longitude}` : "Not mapped"}</dd></div>
                  </dl>
                  <div className="card-actions">
                    <button className="button secondary" onClick={() => startEdit(farm)}>Edit</button>
                    <button className="button danger" onClick={() => removeFarm(farm.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {activeTab === "map" && (
        <section>
          <div className="section-heading"><div><h2>Farm GIS view</h2><p>Markers use each farm's saved latitude and longitude.</p></div></div>
          {markers.length ? <FarmMap markers={markers} /> : <div className="state-card">No farms have GPS coordinates yet.</div>}
        </section>
      )}

      {activeTab === "manage" && (
        <form className="farm-form" onSubmit={submit}>
          <div className="form-section"><h2>{editingId ? "Edit farm" : "Register a farm"}</h2><p>Fields marked with * are required.</p></div>
          <div className="form-grid">
            <label>Farm name *<input required value={form.name} onChange={(e) => updateField("name", e.target.value)} /></label>
            <label>Location name<input value={form.location_name} onChange={(e) => updateField("location_name", e.target.value)} placeholder="Village, road, or landmark" /></label>
            <label>Country *<input required value={form.country} onChange={(e) => updateField("country", e.target.value)} /></label>
            <label>District<input value={form.district} onChange={(e) => updateField("district", e.target.value)} /></label>
            <label>Area (hectares) *<input required min="0" step="0.01" type="number" value={form.area_hectares} onChange={(e) => updateField("area_hectares", Number(e.target.value))} /></label>
            <label>Soil type<input value={form.soil_type} onChange={(e) => updateField("soil_type", e.target.value)} placeholder="Loam, clay, sandy loam..." /></label>
            <label>Water source<input value={form.water_source} onChange={(e) => updateField("water_source", e.target.value)} placeholder="Rainfed, well, irrigation..." /></label>
          </div>
          <fieldset className="gps-fieldset">
            <legend>GPS / GIS location</legend>
            <p>Use the device location or enter coordinates manually. Browser GPS normally requires localhost or HTTPS.</p>
            <button className="button secondary" type="button" onClick={useCurrentLocation}>Use my current location</button>
            <div className="form-grid two">
              <label>Latitude<input type="number" step="0.0000001" min="-90" max="90" value={form.latitude ?? ""} onChange={(e) => updateField("latitude", e.target.value === "" ? null : Number(e.target.value))} /></label>
              <label>Longitude<input type="number" step="0.0000001" min="-180" max="180" value={form.longitude ?? ""} onChange={(e) => updateField("longitude", e.target.value === "" ? null : Number(e.target.value))} /></label>
            </div>
          </fieldset>
          <label>Notes<textarea rows={4} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} /></label>
          <div className="form-actions"><button className="button secondary" type="button" onClick={resetForm}>Clear</button><button className="button primary" disabled={saving} type="submit">{saving ? "Saving..." : editingId ? "Update farm" : "Register farm"}</button></div>
        </form>
      )}
    </main>
  );
}

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crop, CropCategory, listCropCategories, listCrops } from "../services/crops";

function unwrap<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [categories, setCategories] = useState<CropCategory[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [water, setWater] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCrops() {
    setLoading(true);
    setError("");
    try {
      const response = await listCrops({ search, category, water });
      setCrops(unwrap(response));
    } catch {
      setError("Crop information could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    listCropCategories().then((data) => setCategories(unwrap(data))).catch(() => setCategories([]));
    loadCrops();
    // Initial load only; filters submit explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => `${crops.length} crop${crops.length === 1 ? "" : "s"} displayed`, [crops.length]);

  function submit(event: FormEvent) {
    event.preventDefault();
    loadCrops();
  }

  function reset() {
    setSearch("");
    setCategory("");
    setWater("");
    setTimeout(loadCrops, 0);
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <span className="eyebrow">CARDI Crop Knowledge</span>
        <h1>Explore crops suited to Caribbean farming</h1>
        <p>Search practical growing information, water needs, soil guidance, pest management, and harvest recommendations.</p>
      </section>

      <form className="filter-panel" onSubmit={submit}>
        <label>
          Search
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mango, tomato, cassava..." />
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          Water requirement
          <select value={water} onChange={(event) => setWater(event.target.value)}>
            <option value="">Any</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <div className="filter-actions">
          <button className="button primary" type="submit">Apply filters</button>
          <button className="button secondary" type="button" onClick={reset}>Reset</button>
        </div>
      </form>

      <div className="section-heading"><h2>Crop library</h2><span>{summary}</span></div>
      {loading && <div className="state-card">Loading crop knowledge...</div>}
      {error && <div className="state-card error">{error}</div>}
      {!loading && !error && crops.length === 0 && <div className="state-card">No crops match the selected filters.</div>}

      <section className="crop-grid">
        {crops.map((crop) => (
          <article className="crop-card" key={crop.id}>
            <div className="crop-image-wrap">
              {crop.image_url ? <img src={crop.image_url} alt={crop.name} /> : <div className="crop-placeholder">{crop.name.slice(0, 1)}</div>}
              <span className="crop-badge">{crop.category_name}</span>
            </div>
            <div className="crop-card-body">
              <h3>{crop.name}</h3>
              <p className="scientific">{crop.scientific_name}</p>
              <p>{crop.description}</p>
              <div className="crop-facts">
                <span>{crop.growing_duration_days ? `${crop.growing_duration_days} days` : "Duration varies"}</span>
                <span>{crop.water_requirement} water</span>
              </div>
              <Link className="button primary full" to={`/crops/${crop.id}`}>View growing guide</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

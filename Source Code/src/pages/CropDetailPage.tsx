import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Crop, getCrop } from "../services/crops";

export default function CropDetailPage() {
  const { id } = useParams();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getCrop(id).then(setCrop).catch(() => setError("This crop could not be loaded."));
  }, [id]);

  if (error) return <main className="page-shell"><div className="state-card error">{error}</div></main>;
  if (!crop) return <main className="page-shell"><div className="state-card">Loading crop guide...</div></main>;

  return (
    <main className="page-shell">
      <Link to="/crops" className="back-link">← Back to crop library</Link>
      <section className="crop-detail-hero">
        <div>
          <span className="eyebrow">{crop.category_name}</span>
          <h1>{crop.name}</h1>
          <p className="scientific large">{crop.scientific_name}</p>
          <p>{crop.description}</p>
          <div className="crop-facts detail">
            <span>{crop.growing_duration_days ? `${crop.growing_duration_days} growing days` : "Variable duration"}</span>
            <span>{crop.water_requirement} water</span>
            <span>{crop.sunlight_requirement}</span>
          </div>
        </div>
        {crop.image_url && <img src={crop.image_url} alt={crop.name} />}
      </section>

      <section className="detail-grid">
        <article className="content-card"><h2>Soil and planting</h2><p><strong>Suitable soils:</strong> {crop.soil_types.join(", ") || "Consult local guidance"}</p><p>{crop.planting_notes || "No planting notes recorded."}</p></article>
        <article className="content-card"><h2>Fertilizer</h2><p>{crop.fertilizer_recommendations || "No fertilizer guidance recorded."}</p></article>
        <article className="content-card"><h2>Pest management</h2><p>{crop.pest_management || "No pest guidance recorded."}</p></article>
        <article className="content-card"><h2>Harvest guidance</h2><p>{crop.harvest_guidance || "No harvest guidance recorded."}</p></article>
        <article className="content-card"><h2>Nutrition</h2><p>{crop.nutritional_info || "No nutritional notes recorded."}</p></article>
        <article className="content-card"><h2>Primary uses</h2><p>{crop.primary_uses.join(", ") || "No uses recorded."}</p></article>
      </section>
    </main>
  );
}

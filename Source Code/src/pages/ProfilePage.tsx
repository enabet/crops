import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile,
  type UserProfile,
} from "../services/profile";

type ProfileForm = {
  first_name: string;
  last_name: string;
  country: string;
  district: string;
};

const emptyForm: ProfileForm = {
  first_name: "",
  last_name: "",
  country: "",
  district: "",
};

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getProfile();

        setProfile(data);
        setForm({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          country: data.country ?? "",
          district: data.district ?? "",
        });
      } catch {
        setErrorMessage("Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      const updated = await updateProfile(form);

      setProfile(updated);
      setSuccessMessage("Profile updated successfully.");
    } catch {
      setErrorMessage("Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="profile-page">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div>
          <p className="page-eyebrow">ACCOUNT</p>
          <h1>My Profile</h1>
          <p>
            Review your account information and update your basic
            personal details.
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-summary-card">
          <div className="profile-avatar">
            {(
              profile?.first_name?.[0] ||
              profile?.email?.[0] ||
              "U"
            ).toUpperCase()}
          </div>

          <h2>
            {profile?.first_name || profile?.last_name
              ? `${profile?.first_name ?? ""} ${
                  profile?.last_name ?? ""
                }`.trim()
              : "CARDI User"}
          </h2>

          <p>{profile?.email}</p>

          <span className="profile-role">
            {profile?.role?.replaceAll("_", " ")}
          </span>

          <dl className="profile-summary-list">
            <div>
              <dt>Country</dt>
              <dd>{profile?.country || "Not provided"}</dd>
            </div>

            <div>
              <dt>District</dt>
              <dd>{profile?.district || "Not provided"}</dd>
            </div>

            <div>
              <dt>User ID</dt>
              <dd>{profile?.id}</dd>
            </div>
          </dl>
        </aside>

        <div className="profile-form-card">
          <div className="profile-form-header">
            <h2>Basic Information</h2>
            <p>
              Your email address and role cannot be changed from this
              page.
            </p>
          </div>

          {successMessage && (
            <div className="profile-alert success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="profile-alert error">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="profile-form-grid">
              <label>
                First name
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
              </label>

              <label>
                Last name
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={profile?.email ?? user?.email ?? ""}
                  disabled
                />
              </label>

              <label>
                Role
                <input
                  type="text"
                  value={profile?.role?.replaceAll("_", " ") ?? ""}
                  disabled
                />
              </label>

              <label>
                Country
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Belize"
                />
              </label>

              <label>
                District
                <input
                  type="text"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="Cayo"
                />
              </label>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
import { useEffect, useState } from "react";
import Toast from "../components/ui/Toast";
import {
  getRoleBadgeColor,
  getRoleCapabilityLabels,
  getRoleDisplayName,
  getUserRole,
} from "../utils/role";
import { cacheProfile, getMyProfile, readCachedProfile, updateMyProfile } from "../services/profileService";

export default function Settings() {
  const role = getUserRole();
  const roleName = getRoleDisplayName();
  const badgeColor = getRoleBadgeColor();
  const capabilities = getRoleCapabilityLabels(role);
  const cached = readCachedProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [profile, setProfile] = useState({
    name: cached.name || "",
    email: cached.email || "",
    display_name: cached.display_name || cached.name || "",
    phone: cached.phone || "",
    organization: cached.organization || "",
    job_title: cached.job_title || "",
    timezone: cached.timezone || "",
    bio: cached.bio || "",
    avatar_url: cached.avatar_url || "",
    last_login_at: cached.last_login_at || "",
    last_login_ip: cached.last_login_ip || "",
  });

  const pushToast = (message, severity = "info") => {
    setToast({ message, severity });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMyProfile();
        if (res.status === "success") {
          const p = res.profile || {};
          const next = {
            name: p.name || "",
            email: p.email || "",
            display_name: p.display_name || p.name || "",
            phone: p.phone || "",
            organization: p.organization || "",
            job_title: p.job_title || "",
            timezone: p.timezone || "",
            bio: p.bio || "",
            avatar_url: p.avatar_url || "",
            last_login_at: p.last_login_at || "",
            last_login_ip: p.last_login_ip || "",
          };
          setProfile(next);
          cacheProfile({ ...p, ...next });
        }
      } catch (error) {
        pushToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateMyProfile({
        name: profile.name,
        display_name: profile.display_name,
        phone: profile.phone,
        organization: profile.organization,
        job_title: profile.job_title,
        timezone: profile.timezone,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      });
      if (res.status === "success") {
        const p = res.profile || {};
        cacheProfile({
          ...p,
          display_name: p.display_name || p.name || profile.display_name || "User",
        });
        pushToast("Profile updated successfully", "success");
      } else {
        pushToast(res.message || "Failed to update profile", "error");
      }
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      pushToast("Please select an image file", "warning");
      return;
    }
    if (file.size > 700 * 1024) {
      pushToast("Image too large. Max 700KB", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === "string" ? reader.result : "";
      if (base64) {
        setProfile((prev) => ({ ...prev, avatar_url: base64 }));
      }
    };
    reader.onerror = () => pushToast("Failed to read image", "error");
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="cyber-card text-center py-10">
        <p className="text-gray-300">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h2 className="text-3xl cyber-gradient-text mb-2">Settings</h2>
        <p className="text-gray-400">Manage your account profile and preferences</p>
      </div>

      <div className="cyber-card">
        <h3 className="text-xl font-semibold mb-4 text-cyberBlue">Account Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-800/50 rounded-lg border border-cyberPurple/20">
            <p className="text-sm text-gray-400">Account Type</p>
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium border ${badgeColor}`}>
              {roleName}
            </span>
          </div>
          <div className="p-4 bg-dark-800/50 rounded-lg border border-cyberPurple/20">
            <p className="text-sm text-gray-400">Last Login</p>
            <p className="text-sm text-gray-200 mt-2">
              {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-1">IP: {profile.last_login_ip || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="cyber-card">
        <h3 className="text-xl font-semibold mb-4 text-cyberBlue">Role Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {capabilities.map((capability) => (
            <div
              key={capability}
              className="p-3 rounded-lg border border-cyberPurple/20 bg-dark-800/50 text-gray-200 text-sm"
            >
              {capability}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="cyber-card space-y-4">
        <h3 className="text-xl font-semibold text-cyberBlue">Profile Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-start">
          <div className="flex flex-col items-center gap-2">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile avatar"
                className="h-24 w-24 rounded-full object-cover border border-cyberPurple/40"
              />
            ) : (
              <div className="h-24 w-24 rounded-full border border-cyberPurple/30 bg-dark-800/60 flex items-center justify-center text-gray-400 text-sm">
                No photo
              </div>
            )}
            <label className="text-xs text-gray-400">Avatar Preview</label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="cyber-input file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md file:bg-cyberPurple/30 file:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Supports image upload (stored as base64, max 700KB)</p>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Or Avatar URL</label>
              <input
                className="cyber-input"
                name="avatar_url"
                value={profile.avatar_url}
                onChange={handleChange}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Full Name</label>
            <input className="cyber-input" name="name" value={profile.name} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Display Name</label>
            <input className="cyber-input" name="display_name" value={profile.display_name} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Email</label>
            <input className="cyber-input opacity-70 cursor-not-allowed" value={profile.email} disabled />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Phone</label>
            <input className="cyber-input" name="phone" value={profile.phone} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Organization</label>
            <input className="cyber-input" name="organization" value={profile.organization} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Job Title</label>
            <input className="cyber-input" name="job_title" value={profile.job_title} onChange={handleChange} />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Timezone</label>
            <input className="cyber-input" name="timezone" value={profile.timezone} onChange={handleChange} placeholder="e.g. UTC+05:30" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 block mb-1">Bio</label>
            <textarea className="cyber-input min-h-[96px]" name="bio" value={profile.bio} onChange={handleChange} />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="cyber-btn">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: "",
    lastName: "",
    dob: "",
    age: "",
    address: "",
    phoneNumber: "",
    email: "",
    profilePhoto: null,
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        lastName: user.lastName || "",
        dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        age: user.age || "",
        address: user.address || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
        profilePhoto: user.profilePhoto || null,
      });
      setProfilePhotoPreview(user.profilePhoto || null);
      setLoading(false);
    }
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("Photo is too large. Maximum size is 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePhotoPreview(base64String);
        setProfileData({ ...profileData, profilePhoto: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhotoPreview(null);
    setProfileData({ ...profileData, profilePhoto: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await axios.put(
        `http://localhost:5001/api/users/${user.id}`,
        profileData
      );
      setMessage("Profile updated successfully!");
      // Refresh user data
      await axios.get("http://localhost:5001/api/auth/me");
      window.location.reload();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 🔴 RED–BLACK LOGIN THEME BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b0b] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ef4444_0%,transparent_35%)] opacity-40" />

      {/* CONTENT LAYER */}
      <div className="relative">
        {/* NAVBAR */}
        <nav className="bg-black/60 backdrop-blur border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-extrabold text-red-500 tracking-wide">
                My Profile
              </div>

              <div className="flex gap-6 items-center text-sm font-semibold">
                <span
                  onClick={() => navigate("/")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Home
                </span>

                <span
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="cursor-pointer text-gray-200 hover:text-red-600 hover:underline underline-offset-4 transition"
                >
                  Logout
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* 🤍 AESTHETIC GLASS–LIKE WHITE CARD */}
          <div className="bg-white/95 rounded-2xl shadow-2xl border border-red-200/40 p-6">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">
              Profile Information
              <div className="h-[3px] w-16 bg-red-400 rounded-full mt-2" />
            </h2>

            {message && (
              <div
                className={`mb-4 px-4 py-3 rounded font-medium ${
                  message.includes("success")
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PROFILE PHOTO */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profilePhotoPreview ? (
                      <div className="relative">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-red-200 shadow-md"
                        />

                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-red-200 text-gray-500">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Max 5MB • JPG • PNG • GIF
                    </p>
                  </div>
                </div>
              </div>

              {/* NAME ROW */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md focus:ring-red-300 focus:border-red-400"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md focus:ring-red-300 focus:border-red-400"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* DOB + AGE */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md focus:ring-red-300 focus:border-red-400"
                    value={profileData.dob}
                    onChange={(e) =>
                      setProfileData({ ...profileData, dob: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md focus:ring-red-300 focus:border-red-400"
                    value={profileData.age}
                    onChange={(e) =>
                      setProfileData({ ...profileData, age: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ADDRESS */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  rows="2"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md focus:ring-red-300 focus:border-red-400"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md focus:ring-red-300 focus:border-red-400"
                  value={profileData.phoneNumber}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      phoneNumber: e.target.value,
                    })
                  }
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  disabled
                  className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                  value={profileData.email}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              {/* ROLE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>

                <div className="px-3 py-2 bg-gray-100 rounded-md w-fit">
                  <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 shadow disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Update Profile"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex-1 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

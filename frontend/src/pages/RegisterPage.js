import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
        setProfilePhotoPreview(reader.result);
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfilePhotoPreview(null);
    setProfilePhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(
      name,
      lastName,
      dob,
      age,
      address,
      phoneNumber,
      email,
      password,
      role,
      profilePhoto
    );
    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-wide">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Join the Star Cast community
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`mt-8 space-y-6 bg-black/60 backdrop-blur-xl border border-red-700/40 shadow-[0_0_25px_rgba(220,38,38,0.35)] rounded-xl p-8 transition-all duration-300 ${
            error ? "animate-shake" : ""
          }`}
        >
          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile Photo
              </label>

              <div className="flex items-center gap-4">
                <div className="relative">
                  {profilePhotoPreview ? (
                    <div className="relative">
                      <img
                        src={profilePhotoPreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-red-600 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-600 flex items-center justify-center text-gray-400 text-xs">
                      No Photo
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-red-900/40 file:text-white hover:file:bg-red-800/60 cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Max 5MB — JPG / PNG / GIF
                  </p>
                </div>
              </div>
            </div>

            {/* First / Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">First Name *</label>
                <input
                  id="name"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  placeholder="First name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Last Name</label>
                <input
                  id="lastName"
                  className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* DOB + Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div>
                <label className="text-sm text-gray-300">Age</label>
                <input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  placeholder="Your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm text-gray-300">Address</label>
              <textarea
                id="address"
                rows="2"
                className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-300">Phone Number *</label>
              <input
                id="phoneNumber"
                type="tel"
                required
                className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-300">Email *</label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password (Show / Hide text) */}
            <div>
              <label className="text-sm text-gray-300">Password *</label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-400 hover:text-white transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm text-gray-300">Account Type</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md bg-black/70 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-red-600 focus:border-red-600"
              >
                <option value="user">User</option>
                <option value="casting">Casting</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-800/40 focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          {/* Links */}
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="font-medium text-red-400 hover:text-red-300 transition"
            >
              Already have an account? Sign in
            </Link>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="font-medium text-gray-400 hover:text-white transition"
            >
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

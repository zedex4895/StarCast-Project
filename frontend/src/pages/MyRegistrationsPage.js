import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "user") {
      navigate("/");
      return;
    }
    fetchRegistrations();
  }, [user, navigate]);

  const fetchRegistrations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/casting/user/registrations"
      );
      setRegistrations(response.data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch registrations";
      console.error("Error details:", {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
      alert(`Failed to fetch registrations: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-400",
        border: "border-yellow-500/30",
        label: "Pending Review",
        icon: "",
      },
      approved: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        border: "border-green-500/30",
        label: "Approved!",
        icon: "",
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-400",
        border: "border-red-500/30",
        label: " Not Selected",
        icon: "",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text} border ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0f0f0f] to-black" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#dc2626_0%,transparent_30%)] opacity-40" />

      {/* CONTENT WRAPPER */}
      <div className="relative">
        {/* NAVBAR */}
        <nav className="bg-black/60 backdrop-blur shadow border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-bold text-red-600 tracking-wide">
                Star Cast
              </div>

              {/* TEXT LINKS */}
              <div className="flex gap-6 items-center text-sm font-semibold">
                <span
                  onClick={() => navigate("/")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Home
                </span>

                <span
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Profile
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

        {/* MAIN SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-white mb-2">
              My Applications
            </h1>
            <p className="text-white/60">
              Track your audition applications and see where you stand
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 text-white/60">
                <svg
                  className="animate-spin h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-xl">Loading your applications...</span>
              </div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
              <div className="text-xl text-white font-semibold mb-2">
                No registrations yet
              </div>

              <div className="text-sm text-white/60 mb-6">
                Find your dream role and start your journey!
              </div>

              <span
                onClick={() => navigate("/")}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all"
              >
                Browse Auditions →
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {registrations.map((registration) => {
                const ticket = registration.ticket;
                const status = registration.status || "pending";

                return (
                  <div
                    key={registration._id}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {ticket?.title || "Unknown Audition"}
                          </h2>

                          <p className="text-white/60 mb-4">
                            {ticket?.description || ""}
                          </p>
                        </div>

                        <div className="ml-4">{getStatusBadge(status)}</div>
                      </div>

                      {ticket?.images?.length > 0 && (
                        <div className="mb-4">
                          <img
                            src={ticket.images[0]}
                            alt={ticket?.title}
                            className="w-full h-60 object-cover rounded-xl border border-white/10"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs font-medium text-white/50 mb-1">
                            Category
                          </div>
                          <div className="text-white font-semibold capitalize">
                            {ticket?.category || "N/A"}
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs font-medium text-white/50 mb-1">
                            Location
                          </div>
                          <div className="text-white font-semibold">
                            {ticket?.location || "N/A"}
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs font-medium text-white/50 mb-1">
                            Audition Date
                          </div>
                          <div className="text-white font-semibold">
                            {ticket?.date
                              ? new Date(ticket.date).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-xs font-medium text-white/50 mb-1">
                            Applied On
                          </div>
                          <div className="text-white font-semibold">
                            {registration?.registeredAt
                              ? new Date(
                                  registration.registeredAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mt-4 p-4 rounded-xl ${
                          status === "approved"
                            ? "bg-green-500/10 border border-green-500/20"
                            : status === "rejected"
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-yellow-500/10 border border-yellow-500/20"
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            status === "approved"
                              ? "text-green-400"
                              : status === "rejected"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {status === "approved" &&
                            "Congratulations! Your registration has been approved. The casting director will contact you soon. Get ready to shine!"}

                          {status === "rejected" &&
                            "Unfortunately, you weren't selected for this role. Don't give up — your perfect role is out there! Keep applying."}

                          {status === "pending" &&
                            " Your application is being reviewed by the casting team. Sit tight — good things take time!"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRegistrationsPage;

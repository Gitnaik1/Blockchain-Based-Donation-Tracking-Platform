import React, { useState } from "react";
import { Heart, Search, Filter, ArrowUpRight } from "lucide-react";

export const FeaturedNgos = ({ ngos, onSelectNgo, onDonateToNgo }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "Environment", "Education", "Healthcare"];

  const filteredNgos = ngos.filter((ngo) => {
    const matchesCategory =
      selectedCategory === "All" || ngo.category === selectedCategory;
    const matchesSearch =
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="ngos" className="py-20 lg:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[#2563EB] text-sm font-outfit font-bold uppercase tracking-wider">
              Global Partners
            </span>
            <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold text-[#0F172A] tracking-tight">
              Featured Verified NGOs
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E2E8F0]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-inter font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#1E3A8A] text-white"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#1E3A8A] text-sm font-inter font-semibold rounded-lg border border-[#E2E8F0] transition-colors"
            >
              View All Directory
            </button>
          </div>
        </div>

        {/* NGO Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map((ngo) => {
            const progressPercent = Math.min(
              100,
              Math.round((ngo.raised / ngo.goal) * 100)
            );

            return (
              <div
                key={ngo.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={ngo.image}
                      alt={ngo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-[#2563EB] text-xs font-inter font-semibold rounded shadow-sm">
                        {ngo.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-outfit font-bold text-xl text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                        {ngo.name}
                      </h3>
                      <p className="text-[#64748B] font-inter text-sm leading-relaxed line-clamp-2">
                        {ngo.shortDescription}
                      </p>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center justify-between text-xs sm:text-[13px] font-inter">
                        <div>
                          <span className="text-[#64748B]">Raised: </span>
                          <span className="text-[#0F172A] font-bold">
                            ${ngo.raised.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[#64748B]">
                          Goal: ${ngo.goal.toLocaleString()}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1E3A8A] rounded-full transition-all duration-700"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className="text-[#94A3B8] text-xs sm:text-[13px] font-inter">
                    {ngo.donorsCount.toLocaleString()} Donors
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDonateToNgo(ngo)}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] text-xs font-inter font-semibold rounded-md transition-colors"
                    >
                      Donate
                    </button>
                    <button
                      onClick={() => onSelectNgo(ngo)}
                      className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-inter font-semibold rounded-md transition-colors flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

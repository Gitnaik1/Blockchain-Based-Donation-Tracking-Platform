import React from "react";

export const StatsBand = () => {
  const stats = [
    { value: "$18.4M", label: "Total Donations Tracked" },
    { value: "312,492", label: "Verified Transactions" },
    { value: "84", label: "Registered NGOs" },
    { value: "249", label: "Projects Fully Funded" },
  ];

  return (
    <section className="w-full bg-[#F8FAFC] border-y border-[#E2E8F0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center gap-1.5 p-2">
              <span className="text-[#1E3A8A] text-3xl sm:text-4xl lg:text-[40px] font-outfit font-extrabold tracking-tight">
                {stat.value}
              </span>
              <span className="text-[#64748B] text-xs sm:text-14px font-inter font-normal">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

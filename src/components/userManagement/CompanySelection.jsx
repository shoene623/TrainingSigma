import React from "react";

function CompanySelection({ companies, selectedCompany, setSelectedCompany }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Assign Company</h2>
      <select
        value={selectedCompany}
        onChange={(e) => setSelectedCompany(e.target.value)}
        className="w-full p-2 border rounded-md"
      >
        <option value="">Select a company</option>
        {companies.map((company) => (
          <option key={company.pkCompany} value={company.pkCompany}>
            {company.CompName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CompanySelection;
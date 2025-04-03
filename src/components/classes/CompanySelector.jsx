import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CompanySelector = ({ formData, setFormData }) => {
  const [companies, setCompanies] = useState([]);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("Company")
        .select("pkCompany, CompName")
        .order("CompName", { ascending: true });

      if (error) throw error;

      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.name) {
      alert("Please enter a company name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Company")
        .insert({
          CompName: newCompany.name,
          CompAdd1: newCompany.address,
          CompCity: newCompany.city,
          CompState: newCompany.state,
          CompZip: newCompany.zip,
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new company to the dropdown list and select it
      setCompanies((prev) => [...prev, data]);
      setFormData({ ...formData, companyId: data.pkCompany });
      setNewCompany({ name: "", address: "", city: "", state: "", zip: "" });
      setShowAddCompany(false);
    } catch (error) {
      console.error("Error adding company:", error);
    }
  };

  return (
    <div>
      <label htmlFor="companyId" className="block text-sm font-medium">
        Select Company
      </label>
      <select
        value={formData.companyId || ""}
        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
        className="w-full p-2 border rounded-md"
      >
        <option value="">Select a company</option>
        {companies.map((company) => (
          <option key={company.pkCompany} value={company.pkCompany}>
            {company.CompName}
          </option>
        ))}
      </select>
      <Button
        variant="link"
        className="mt-2 text-sm"
        onClick={() => setShowAddCompany((prev) => !prev)}
      >
        {showAddCompany ? "Cancel" : "Add New Company"}
      </Button>
      {showAddCompany && (
        <div className="space-y-2 mt-4">
          <Input
            placeholder="Company Name"
            value={newCompany.name}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
          />
          <Input
            placeholder="Address"
            value={newCompany.address}
            onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
          />
          <Input
            placeholder="City"
            value={newCompany.city}
            onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
          />
          <Input
            placeholder="State"
            value={newCompany.state}
            onChange={(e) => setNewCompany({ ...newCompany, state: e.target.value })}
          />
          <Input
            placeholder="Zip"
            value={newCompany.zip}
            onChange={(e) => setNewCompany({ ...newCompany, zip: e.target.value })}
          />
          <Button onClick={handleAddCompany}>Add Company</Button>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
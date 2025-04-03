import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EditPendingClass = () => {
  const { id } = useParams(); // Get the pending class ID from the URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyId: null,
    siteId: null,
    educatorId: null,
    coordinatorId: null,
    notes: "",
  });
  const [pendingClass, setPendingClass] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [educators, setEducators] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingClass();
    fetchCompanies();
    fetchEducators();
    fetchCoordinators();
  }, [id]);

  useEffect(() => {
    if (formData.companyId) {
      fetchSites(formData.companyId);
    }
  }, [formData.companyId]);

  const fetchPendingClass = async () => {
    try {
      const { data, error } = await supabase
        .from("pending_class")
        .select(`
          pktrainingclassid,
          fkSiteID,
          fkEducatorID,
          coordinator_id,
          notes,
          sites:fkSiteID (
            pkSiteID,
            SiteName,
            SiteCity,
            SiteState,
            fkCompID
          ),
          educators:fkEducatorID (
            pkEducatorID,
            first,
            last,
            teach_state
          )
        `)
        .eq("pktrainingclassid", id)
        .single();

      if (error) throw error;

      setPendingClass(data);
      setFormData({
        companyId: data.sites?.fkCompID || null,
        siteId: data.fkSiteID || null,
        educatorId: data.fkEducatorID || null,
        coordinatorId: data.coordinator_id || null,
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Error fetching pending class:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchSites = async (companyId) => {
    try {
      const { data, error } = await supabase
        .from("Site")
        .select("pkSiteID, SiteName, SiteCity, SiteState")
        .eq("fkCompID", companyId)
        .order("SiteName", { ascending: true });

      if (error) throw error;

      setSites(data || []);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchEducators = async () => {
    try {
      const { data, error } = await supabase
        .from("educators")
        .select("pkEducatorID, first, last, teach_state")
        .order("last", { ascending: true });

      if (error) throw error;

      setEducators(data || []);
    } catch (error) {
      console.error("Error fetching educators:", error);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("role", "LifeSafe");

      if (error) throw error;

      setCoordinators(data || []);
    } catch (error) {
      console.error("Error fetching coordinators:", error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("pending_class")
        .update({
          fkSiteID: formData.siteId,
          fkEducatorID: formData.educatorId,
          coordinator_id: formData.coordinatorId,
          notes: formData.notes,
        })
        .eq("pktrainingclassid", id);

      if (error) throw error;

      alert("Pending class updated successfully!");
      navigate("/pending-classes"); // Redirect back to the pending classes page
    } catch (error) {
      console.error("Error updating pending class:", error);
      alert("Failed to update the pending class.");
    }
  };

  const companyOptions = companies.map((company) => ({
    value: company.pkCompany,
    label: company.CompName,
  }));

  const siteOptions = sites.map((site) => ({
    value: site.pkSiteID,
    label: `${site.SiteName} - ${site.SiteCity}, ${site.SiteState}`,
  }));

  const educatorOptions = educators.map((educator) => ({
    value: educator.pkEducatorID,
    label: `${educator.first} ${educator.last} (${educator.teach_state})`,
  }));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Edit Pending Class</h1>

      <form className="space-y-6">
        {/* Company Selector */}
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium">
            Select Company
          </label>
          <Select
            options={companyOptions}
            value={companyOptions.find((option) => option.value === formData.companyId)}
            onChange={(selectedOption) => setFormData({ ...formData, companyId: selectedOption.value })}
            className="w-full"
            placeholder="Choose a company"
          />
        </div>

        {/* Site Selector */}
        <div>
          <label htmlFor="siteId" className="block text-sm font-medium">
            Select Site
          </label>
          <Select
            options={siteOptions}
            value={siteOptions.find((option) => option.value === formData.siteId)}
            onChange={(selectedOption) => setFormData({ ...formData, siteId: selectedOption.value })}
            className="w-full"
            placeholder="Choose a site"
            isDisabled={!formData.companyId}
          />
        </div>

        {/* Educator Selector */}
        <div>
          <label htmlFor="educatorId" className="block text-sm font-medium">
            Select Educator
          </label>
          <Select
            options={educatorOptions}
            value={educatorOptions.find((option) => option.value === formData.educatorId)}
            onChange={(selectedOption) => setFormData({ ...formData, educatorId: selectedOption.value })}
            className="w-full"
            placeholder="Choose an educator"
          />
        </div>

        {/* Coordinator Selector */}
        <div>
          <label htmlFor="coordinatorId" className="block text-sm font-medium">
            Select Coordinator
          </label>
          <select
            id="coordinatorId"
            value={formData.coordinatorId || ""}
            onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a coordinator</option>
            {coordinators.map((coordinator) => (
              <option key={coordinator.id} value={coordinator.id}>
                {coordinator.email}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="block w-full border rounded-md p-2"
            placeholder="Enter any additional details..."
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default EditPendingClass;
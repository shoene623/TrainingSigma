"use client";

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "../components/ui/Modal";

const CreateClassRequest = () => {
  const [formData, setFormData] = useState({
    companyId: "",
    siteId: "",
    classTypes: ["Setup Time"], // Default to "Setup Time" being selected
    preferredDateStart: "",
    preferredDateEnd: "",
    notes: "",
    educatorId: "",
  });
  const [emailPreview, setEmailPreview] = useState(null); // State for email preview
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [educators, setEducators] = useState([]);
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [newSite, setNewSite] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const classTypes = [
    { name: "AED", hours: 2 },
    { name: "CPR", hours: 3 },
    { name: "BBP", hours: 1 },
    { name: "SFA", hours: 2 },
    { name: "EFA", hours: 3 },
    { name: "40 Hour First Responder", hours: 40 },
    { name: "Advanced SFA", hours: 4 },
    { name: "AHA CPR Pro", hours: 3 },
    { name: "ASHI BLS", hours: 3 },
    { name: "ASHI CABS", hours: 2 },
    { name: "ASHI CPR Pro", hours: 3 },
    { name: "Babysitter Safety 101", hours: 2 },
    { name: "Babysitter Safety 102", hours: 2 },
    { name: "Earthquake Preparedness", hours: 1 },
    { name: "ECSI CPR Pro", hours: 3 },
    { name: "Infant CPR", hours: 2 },
    { name: "Pediatric CPR", hours: 3 },
    { name: "Setup Time", hours: 1 },
  ];

  useEffect(() => {
    fetchCompanies();
    fetchEducators();
  }, []);

  useEffect(() => {
    if (formData.companyId) {
      fetchSites(formData.companyId);
    }
  }, [formData.companyId]);

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
        .select("pkSiteID, SiteName, SiteAdd1, SiteCity, SiteState, SiteZip")
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
        .select("pkEducatorID, first, last, teach_state, rate1, rate2")
        .order("last", { ascending: true });

      if (error) throw error;
      setEducators(data || []);
    } catch (error) {
      console.error("Error fetching educators:", error);
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

      toast({
        title: "Company Added",
        description: "The new company has been successfully added.",
      });

      setCompanies((prev) => [...prev, data]);
      setFormData({ ...formData, companyId: data.pkCompany });
      setNewCompany({ name: "", address: "", city: "", state: "", zip: "" });
      setShowAddCompany(false);
    } catch (error) {
      console.error("Error adding company:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the company.",
      });
    }
  };

  const handleAddSite = async () => {
    if (!newSite.name || !formData.companyId) {
      alert("Please enter a site name and select a company.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("Site")
        .insert({
          SiteName: newSite.name,
          SiteAdd1: newSite.address,
          SiteCity: newSite.city,
          SiteState: newSite.state,
          SiteZip: newSite.zip,
          fkCompID: formData.companyId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Site Added",
        description: "The new site has been successfully added.",
      });

      setSites((prev) => [...prev, data]);
      setFormData({ ...formData, siteId: data.pkSiteID });
      setNewSite({ name: "", address: "", city: "", state: "", zip: "" });
      setShowAddSite(false);
    } catch (error) {
      console.error("Error adding site:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add the site.",
      });
    }
  };

  const handleClassTypeChange = (classType) => {
    setFormData((prev) => {
      const isSelected = prev.classTypes.includes(classType);
      const updatedClassTypes = isSelected
        ? prev.classTypes.filter((type) => type !== classType)
        : [...prev.classTypes, classType];
      return { ...prev, classTypes: updatedClassTypes };
    });
  };

  const calculateTotalHours = () => {
    return formData.classTypes.reduce((total, classType) => {
      const classInfo = classTypes.find((type) => type.name === classType);
      return total + (classInfo?.hours || 0);
    }, 0);
  };

  const calculateEstimate = () => {
    const totalHours = calculateTotalHours();
    return totalHours * (selectedEducator?.rate1 || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
  
      if (sessionError) throw sessionError;
  
      const userId = session?.user?.id;
  
      if (!userId) {
        throw new Error("User is not authenticated.");
      }
  
      // Insert the class request into the `pending_class` table
      const { data, error } = await supabase
        .from("pending_class")
        .insert({
          class_type: formData.classTypes.join(", "),
          preferred_date_start: formData.preferredDateStart,
          preferred_date_end: formData.preferredDateEnd,
          coordinator_id: userId,
          fkSiteID: formData.siteId,
          notes: formData.notes,
          fkEducatorID: formData.educatorId,
          status: "Confirm Educator Dates",
        })
        .select(`
          *,
          Site:fkSiteID (SiteName, SiteAdd1, SiteCity, SiteState, SiteZip),
          Educator:fkEducatorID (first, last),
          Coordinator:coordinator_id (firstName, lastName)
        `) // Include related Site, Educator, and Coordinator fields
        .single();
  
      if (error) throw error;
  
      // Format the email content
      const emailContent = `
        <p>A new class request has been submitted:</p>
        <ul>
          <li><strong>Class Types:</strong> ${data.class_type}</li>
          <li><strong>Preferred Start Date:</strong> ${new Date(data.preferred_date_start).toLocaleDateString()}</li>
          <li><strong>Preferred End Date:</strong> ${new Date(data.preferred_date_end).toLocaleDateString()}</li>
          <li><strong>Site Name:</strong> ${data.Site?.SiteName || "N/A"}</li>
          <li><strong>Site Address:</strong> ${data.Site?.SiteAdd1 || "N/A"}, ${data.Site?.SiteCity || "N/A"}, ${data.Site?.SiteState || "N/A"} ${data.Site?.SiteZip || "N/A"}</li>
          <li><strong>Notes:</strong> ${data.notes || "None"}</li>
          <li><strong>Preffered Educator:</strong> ${data.Educator?.first || "N/A"} ${data.Educator?.last || "N/A"}</li>
          <li><strong>Coordinator:</strong> ${data.Coordinator?.firstName || "N/A"} ${data.Coordinator?.lastName || "N/A"}</li>
        </ul>
      `;
  
      // Set the email preview state and open the modal
      setEmailPreview({
        to: "sean@lifesafeservices.com",
        subject: "New Class Request Submitted",
        html: emailContent,
      });
    } catch (error) {
      console.error("Error creating class request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the class request.",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!emailPreview) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(emailPreview),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Error sending email:", data);
        toast({
          variant: "destructive",
          title: "Error Sending Email",
          description: "Failed to send the email notification.",
        });
        return;
      }

      toast({
        title: "Class Request Created",
        description: "The class request has been successfully created and an email notification has been sent.",
      });

      setEmailPreview(null); // Close the modal
      navigate("/dashboard");
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: "An unexpected error occurred while sending the email.",
      });
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
    label: `${educator.first} ${educator.last} (${educator.teach_state}) - Rate1: $${educator.rate1}/hr, Rate2: $${educator.rate2}/hr`,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Class Request</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Dropdown */}
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
          <Button
            variant="link"
            className="mt-2 text-sm"
            onClick={() => setShowAddCompany((prev) => !prev)}
          >
            {showAddCompany ? "Cancel" : "Add New Company"}
          </Button>
        </div>

        {showAddCompany && (
          <div className="space-y-2">
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

        {/* Site Dropdown */}
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
          <Button
            variant="link"
            className="mt-2 text-sm"
            onClick={() => setShowAddSite((prev) => !prev)}
            disabled={!formData.companyId}
          >
            {showAddSite ? "Cancel" : "Add New Site"}
          </Button>
        </div>

        {showAddSite && (
          <div className="space-y-2">
            <Input
              placeholder="Site Name"
              value={newSite.name}
              onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={newSite.address}
              onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
            />
            <Input
              placeholder="City"
              value={newSite.city}
              onChange={(e) => setNewSite({ ...newSite, city: e.target.value })}
            />
            <Input
              placeholder="State"
              value={newSite.state}
              onChange={(e) => setNewSite({ ...newSite, state: e.target.value })}
            />
            <Input
              placeholder="Zip"
              value={newSite.zip}
              onChange={(e) => setNewSite({ ...newSite, zip: e.target.value })}
            />
            <Button onClick={handleAddSite}>Add Site</Button>
          </div>
        )}

        {/* Educator Dropdown */}
        <div>
          <label htmlFor="educatorId" className="block text-sm font-medium">
            Select Educator
          </label>
          <Select
            options={educatorOptions}
            value={educatorOptions.find((option) => option.value === formData.educatorId)}
            onChange={(selectedOption) => {
              setFormData({ ...formData, educatorId: selectedOption.value });
              setSelectedEducator(educators.find((e) => e.pkEducatorID === selectedOption.value));
            }}
            className="w-full"
            placeholder="Choose an educator"
          />
        </div>

        {/* Class Type Checkboxes */}
        <div>
          <label htmlFor="classTypes" className="block text-sm font-medium">
            Select Class Types
          </label>
          <div className="grid grid-cols-2 gap-2">
            {classTypes.map((classType) => (
              <div key={classType.name} className="flex items-center">
                <input
                  type="checkbox"
                  id={classType.name}
                  checked={formData.classTypes.includes(classType.name)}
                  onChange={() => handleClassTypeChange(classType.name)}
                  className="mr-2"
                />
                <label htmlFor={classType.name} className="text-sm">
                  {classType.name} ({classType.hours} Hours)
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Dates */}
        <div>
          <label htmlFor="preferredDateStart" className="block text-sm font-medium">
            Preferred Start Date
          </label>
          <Input
            id="preferredDateStart"
            name="preferredDateStart"
            type="date"
            value={formData.preferredDateStart}
            onChange={(e) => setFormData({ ...formData, preferredDateStart: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="preferredDateEnd" className="block text-sm font-medium">
            Preferred End Date
          </label>
          <Input
            id="preferredDateEnd"
            name="preferredDateEnd"
            type="date"
            value={formData.preferredDateEnd}
            onChange={(e) => setFormData({ ...formData, preferredDateEnd: e.target.value })}
            required
          />
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
          />
        </div>

        {/* Estimated Cost */}
        <div>
          <label htmlFor="estimate" className="block text-sm font-medium">
            Estimated Cost
          </label>
          <div className="text-lg font-bold">
            ${calculateEstimate().toFixed(2)}
          </div>
        </div>

        <Button
          type="submit"
          disabled={
            !formData.companyId ||
            !formData.siteId ||
            formData.classTypes.length === 0 ||
            !formData.educatorId
          }
        >
          Submit Request
        </Button>
      </form>
      {/* Email Preview Modal */}
      {emailPreview && (
        <Modal isOpen={!!emailPreview} onClose={() => setEmailPreview(null)}>
          <div>
            <h2 className="text-xl font-bold mb-4">Email Preview</h2>
            <p><strong>To:</strong> {emailPreview.to}</p>
            <p><strong>Subject:</strong> {emailPreview.subject}</p>
            <div className="border p-2 rounded-md whitespace-pre-line">
              {emailPreview.html}
            </div>
            <div className="mt-4 text-right">
              <Button
                onClick={handleSendEmail}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send Email
              </Button>
              <Button
                onClick={() => setEmailPreview(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded ml-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CreateClassRequest;
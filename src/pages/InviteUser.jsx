"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import RoleSelection from "../components/userManagement/RoleSelection";
import Select from "react-select";
import Sidebar from "../components/Sidebar"; // Import Sidebar component
import Navbar from "../components/Navbar"; // Import Navbar component

function InviteUser() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedSites, setSelectedSites] = useState([]);
  const [educators, setEducators] = useState([]); // State for educators
  const [selectedEducator, setSelectedEducator] = useState(null); // Selected educator
  const [invitationSent, setInvitationSent] = useState(false);
  const navigate = useNavigate();

  // Fetch companies, sites, and educators when the component mounts
  useEffect(() => {
    fetchCompanies();
    fetchSites();
    fetchEducators();
  }, []);

  // Update sites list when a company is selected
  useEffect(() => {
    filterSites();
  }, [selectedCompany, sites]);

  async function fetchCompanies() {
    const { data, error } = await supabase.from("Company").select("pkCompany, CompName");
    if (error) {
      console.error("❌ Error fetching companies:", error.message);
    } else {
      setCompanies(data);
    }
  }

  async function fetchSites() {
    const { data, error } = await supabase
      .from("Site")
      .select("pkSiteID, SiteName, fkCompID, SiteAdd1, SiteCity, SiteZip, SiteState");

    if (error) {
      console.error("❌ Error fetching sites:", error.message);
    } else {
      setSites(data.sort((a, b) => a.SiteState.localeCompare(b.SiteState)));
    }
  }

  async function fetchEducators() {
    const { data, error } = await supabase
      .from("educators")
      .select("pkEducatorID, first, last, email1");

    if (error) {
      console.error("❌ Error fetching educators:", error.message);
    } else {
      setEducators(data);
    }
  }

  function filterSites() {
    if (selectedCompany) {
      setFilteredSites(sites.filter((site) => site.fkCompID === selectedCompany.value));
    } else {
      setFilteredSites(sites);
    }
  }

  async function inviteUser() {
    if (!email && role !== "educator") {
      alert("⚠️ Email is required.");
      return;
    }

    if (!role) {
      alert("⚠️ Role is required.");
      return;
    }

    const requestData = {
      email: role === "educator" && selectedEducator ? selectedEducator.email1 : email,
      role,
      client_id: selectedCompany ? selectedCompany.value : null, // Only send if selected
      assigned_sites: role === "client_site" && selectedSites.length > 0 ? selectedSites : [],
      educator_id: role === "educator" && selectedEducator ? selectedEducator.pkEducatorID : null,
    };

    try {
      const response = await fetch(
        "https://rppaszzrpijwgozvhvqv.supabase.co/functions/v1/inviteUser",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to invite user");
      }

      alert(`✅ Invite sent to ${requestData.email}. Assigned as ${role}.`);
      setInvitationSent(true);
    } catch (error) {
      console.error("❌ Error inviting user:", error.message);
      alert(`⚠️ Failed to invite user: ${error.message}`);
    }
  }

  const companyOptions = companies.map((company) => ({
    value: company.pkCompany,
    label: company.CompName,
  }));

  const siteOptions = filteredSites.map((site) => ({
    value: site.pkSiteID,
    label: `${site.SiteName} - ${site.SiteAdd1}, ${site.SiteCity}, ${site.SiteZip}`,
  }));

  const educatorOptions = educators.map((educator) => ({
    value: educator.pkEducatorID,
    label: `${educator.first} ${educator.last} (${educator.email1})`,
    email1: educator.email1,
  }));

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <div className="p-6 space-y-8">
          <h1 className="text-3xl font-bold text-gray-800">Invite User & Assign Role</h1>

          {/* Email Input */}
          {role !== "educator" && (
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          )}

          {/* Role Selection */}
          <RoleSelection role={role} setRole={setRole} />

          {/* Educator Selection */}
          {role === "educator" && (
            <div>
              <h2 className="text-xl font-semibold">Select Educator</h2>
              <Select
                options={educatorOptions}
                value={educatorOptions.find((option) => option.value === selectedEducator?.pkEducatorID)}
                onChange={(selectedOption) =>
                  setSelectedEducator(
                    educators.find((educator) => educator.pkEducatorID === selectedOption.value)
                  )
                }
                className="w-full p-2 border rounded-md mb-4"
              />
            </div>
          )}

          {/* Company Selection */}
          {(role === "client_admin" || role === "client_site") && (
            <div>
              <h2 className="text-xl font-semibold">Assign Company</h2>
              <Select
                options={companyOptions}
                value={selectedCompany}
                onChange={setSelectedCompany}
                className="w-full p-2 border rounded-md mb-4"
              />
            </div>
          )}

          {/* Site Selection */}
          {role === "client_site" && (
            <div>
              <h2 className="text-xl font-semibold">Assign Sites</h2>
              <Select
                options={siteOptions}
                isMulti
                value={siteOptions.filter((option) => selectedSites.includes(option.value))}
                onChange={(selectedOptions) =>
                  setSelectedSites(selectedOptions.map((option) => option.value))
                }
                className="w-full p-2 border rounded-md mb-4"
              />
            </div>
          )}

          {/* Invite Button */}
          <button
            onClick={inviteUser}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send Invite
          </button>

          {invitationSent && <p className="text-green-600 mt-4">🎉 Invitation sent successfully!</p>}
        </div>
      </div>
    </div>
  );
}

export default InviteUser;
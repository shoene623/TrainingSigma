"use client";

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/use-toast";

const ThreeDayReminders = () => {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewEmail, setPreviewEmail] = useState(null);
  const [currentClassInfo, setCurrentClassInfo] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingClasses();
  }, []);

  const fetchUpcomingClasses = async () => {
    setLoading(true);

    const today = new Date();
    const fiveDaysAhead = new Date();
    fiveDaysAhead.setDate(today.getDate() + 5);

    const formatDate = (date) => date.toISOString().split("T")[0];
    const todayFormatted = formatDate(today);
    const fiveDaysAheadFormatted = formatDate(fiveDaysAhead);

    console.log("Fetching classes from:", todayFormatted, "to:", fiveDaysAheadFormatted);

    try {
      const { data, error } = await supabase
        .from("trainingLog")
        .select(`
          pkTrainingLogID,
          dateofclass,
          subjects,
          educators:fkEducatorID (first, last, email1),
          sites:fkSiteID (SiteName, SiteAdd1, SiteCity, SiteState, SiteEmail)
        `)
        .gte("dateofclass", todayFormatted)
        .lte("dateofclass", fiveDaysAheadFormatted);

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      console.log("Fetched classes:", data); // Log the fetched data

      setUpcomingClasses(data);
    } catch (error) {
      console.error("Error fetching upcoming classes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load upcoming classes.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewAndSend = (classInfo) => {
    setCurrentClassInfo(classInfo);

    const educatorEmail = classInfo.educators?.email1;
    const siteEmail = classInfo.sites?.SiteEmail;
    const educatorName = classInfo.educators
      ? `${classInfo.educators.first} ${classInfo.educators.last}`
      : "Educator";
    const siteName = classInfo.sites?.SiteName || "the site";
    const className = classInfo.subjects || "this class";
    const classDate = classInfo.dateofclass || "N/A";

    const educatorSubject = `Reminder: Your Class '${className}' on ${classDate}`;
    const educatorHtml = `
      <p>Dear ${educatorName},</p>
      <p>This is a friendly reminder about your upcoming class <strong>'${className}'</strong> scheduled for <strong>${classDate}</strong>.</p>
      <p>Please ensure you are prepared for the session.</p>
      <p>Thank you,</p>
      <p>LifeSafe Services</p>
    `;

    const siteSubject = `Reminder: Class '${className}' on ${classDate} at ${siteName}`;
    const siteHtml = `
      <p>Dear ${siteName} Team,</p>
      <p>This is a reminder that the class <strong>'${className}'</strong> is scheduled to take place on <strong>${classDate}</strong> at your location.</p>
      <p>Please ensure everything is ready for the session.</p>
      <p>Thank you,</p>
      <p>LifeSafe Services</p>
    `;

    setPreviewEmail({
      educator: {
        to: educatorEmail,
        subject: educatorSubject,
        html: educatorHtml,
      },
      site: {
        to: siteEmail,
        subject: siteSubject,
        html: siteHtml,
      },
    });
  };

  const sendEducatorEmail = async () => {
    if (!previewEmail?.educator?.to) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Educator email is missing.",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            to: previewEmail.educator.to,
            subject: previewEmail.educator.subject,
            html: previewEmail.educator.html,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Error sending educator email:", data);
        toast({
          variant: "destructive",
          title: "Error Sending Educator Reminder",
          description: `Failed to send reminder to ${previewEmail.educator.to}: ${data.error || "Unknown error"}`,
        });
        return false;
      }

      toast({
        title: "Educator Reminder Sent",
        description: `Reminder sent to ${previewEmail.educator.to}.`,
      });
      return true;
    } catch (error) {
      console.error("Error sending educator email:", error);
      toast({
        variant: "destructive",
        title: "Error Sending Educator Reminder",
        description: `Failed to send reminder to ${previewEmail.educator.to}: ${error.message}`,
      });
      return false;
    }
  };

  const sendSiteEmail = async () => {
    if (!previewEmail?.site?.to) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Site email is missing.",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL}/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            to: previewEmail.site.to,
            subject: previewEmail.site.subject,
            html: previewEmail.site.html,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Error sending site email:", data);
        toast({
          variant: "destructive",
          title: "Error Sending Site Reminder",
          description: `Failed to send reminder to ${previewEmail.site.to}: ${data.error || "Unknown error"}`,
        });
        return false;
      }

      toast({
        title: "Site Reminder Sent",
        description: `Reminder sent to ${previewEmail.site.to}.`,
      });
      return true;
    } catch (error) {
      console.error("Error sending site email:", error);
      toast({
        variant: "destructive",
        title: "Error Sending Site Reminder",
        description: `Failed to send reminder to ${previewEmail.site.to}: ${error.message}`,
      });
      return false;
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading upcoming classes...</div>;
  }

  if (upcomingClasses.length === 0) {
    return <div className="text-center py-10">No classes scheduled in the next 5 days.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upcoming Classes (Next 5 Days)</h1>
      {upcomingClasses.map((classInfo, index) => (
        <Card key={classInfo.pkTrainingLogID || index}>
          <CardHeader>
            <CardTitle>{classInfo.subjects || "Unnamed Class"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Date:</strong> {classInfo.dateofclass || "N/A"}
            </p>
            <p>
              <strong>Site:</strong> {classInfo.sites?.SiteName || "N/A"} ({classInfo.sites?.SiteEmail || "N/A"})
            </p>
            <p>
              <strong>Educator:</strong> {classInfo.educators
                ? `${classInfo.educators.first} ${classInfo.educators.last}`
                : "N/A"}{" "}
              ({classInfo.educators?.email1 || "N/A"})
            </p>
            <Button onClick={() => handlePreviewAndSend(classInfo)}>
              Preview & Send Reminder
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Modal for Preview and Send */}
      <Modal isOpen={!!previewEmail} onClose={() => setPreviewEmail(null)}>
        {previewEmail && currentClassInfo && (
          <div>
            <h2 className="text-xl font-bold mb-4">Preview Reminder Emails</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Educator Email</h3>
                <p><strong>To:</strong> {previewEmail.educator.to || "N/A"}</p>
                <p><strong>Subject:</strong> {previewEmail.educator.subject}</p>
                <div className="border p-2 rounded-md whitespace-pre-line">{previewEmail.educator.html}</div>
                <Button onClick={sendEducatorEmail} className="mt-2">
                  Send Educator Reminder
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Site Email</h3>
                <p><strong>To:</strong> {previewEmail.site.to || "N/A"}</p>
                <p><strong>Subject:</strong> {previewEmail.site.subject}</p>
                <div className="border p-2 rounded-md whitespace-pre-line">{previewEmail.site.html}</div>
                <Button onClick={sendSiteEmail} className="mt-2">
                  Send Site Reminder
                </Button>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Button variant="outline" onClick={() => setPreviewEmail(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ThreeDayReminders;
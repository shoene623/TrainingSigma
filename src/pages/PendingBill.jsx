import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/use-toast";

const PendingBill = ({ userId }) => {
  const [pendingBills, setPendingBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderEmail, setReminderEmail] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPendingBills = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("trainingLog")
          .select(`
            pkTrainingLogID,
            dateofclass,
            subjects,
            billdate,
            studentCount,
            billable,
            hours,
            expenses,
            coordinator:coordinator_id (firstName, lastName),
            sites:fkSiteID (SiteName, SiteCity, SiteState, SiteZip),
            educators:fkEducatorID (first, last, email1)
          `)
          .is("billdate", null)
          .lt("dateofclass", new Date().toISOString());

        if (error) {
          console.error("Error fetching pending bills:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load pending bills.",
          });
        } else {
          setPendingBills(data || []);
        }
      } catch (error) {
        console.error("Error fetching pending bills:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred while loading pending bills.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingBills();
  }, []);

  const handleUpdateField = async (pkTrainingLogID, field, value) => {
    try {
      const sanitizedValue = value === "" ? null : value;

      const { error } = await supabase
        .from("trainingLog")
        .update({ [field]: sanitizedValue })
        .eq("pkTrainingLogID", pkTrainingLogID);

      if (error) {
        console.error(`Error updating ${field}:`, error);
        toast({
          variant: "destructive",
          title: "Error Updating Field",
          description: `Failed to update ${field}.`,
        });
        return;
      }

      setPendingBills((prev) =>
        prev.map((bill) =>
          bill.pkTrainingLogID === pkTrainingLogID
            ? { ...bill, [field]: sanitizedValue }
            : bill
        )
      );

      toast({
        title: "Field Updated",
        description: `${field} has been successfully updated.`,
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        variant: "destructive",
        title: "Error Updating Field",
        description: `An unexpected error occurred while updating ${field}.`,
      });
    }
  };

  const handleBillClass = async (pkTrainingLogID) => {
    try {
      const currentDate = new Date().toISOString();
      const { error } = await supabase
        .from("trainingLog")
        .update({ billdate: currentDate })
        .eq("pkTrainingLogID", pkTrainingLogID);

      if (error) {
        console.error("Error billing class:", error);
        toast({
          variant: "destructive",
          title: "Error Billing Class",
          description: "Failed to mark the class as billed.",
        });
        return;
      }

      setPendingBills((prev) =>
        prev.filter((bill) => bill.pkTrainingLogID !== pkTrainingLogID)
      );

      toast({
        title: "Class Billed",
        description: "The class has been successfully marked as billed.",
      });
    } catch (error) {
      console.error("Error billing class:", error);
      toast({
        variant: "destructive",
        title: "Error Billing Class",
        description: "An unexpected error occurred while billing the class.",
      });
    }
  };

  const handleOpenReminder = (bill) => {
    const email = bill.educators?.email1;
    const name = `${bill.educators?.first} ${bill.educators?.last}`;
    const siteName = bill.sites?.SiteName || "the site";
    const subject = "Class Roster, Evaluation & Invoice Not Yet Received";
    const html = `
      <p>Dear ${name},</p>
      <p>We have not yet received your roster and evaluations for the training session on <strong>${bill.subjects}</strong> scheduled for <strong>${bill.dateofclass}</strong> at <strong>${siteName}</strong>.</p>
      <p>Please provide the necessary documents at your earliest convenience.</p>
      <p>Thank you,</p>
      <p>LifeSafe Services</p>
    `;

    setReminderEmail({
      to: email,
      subject,
      html,
    });
  };

  const handleSendReminder = async () => {
    if (!reminderEmail) return;

    const url = `${import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL}/send-email`;
    console.log("Sending email to URL:", url);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(reminderEmail),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Error sending reminder email:", data);
        toast({
          variant: "destructive",
          title: "Error Sending Reminder",
          description: `Failed to send reminder to ${reminderEmail.to}.`,
        });
        return;
      }

      toast({
        title: "Reminder Sent",
        description: `Reminder email sent to ${reminderEmail.to}.`,
      });
      setReminderEmail(null);
    } catch (error) {
      console.error("Error sending reminder email:", error);
      toast({
        variant: "destructive",
        title: "Error Sending Reminder",
        description: `An unexpected error occurred while sending the reminder.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Pending Bills</h1>
      {loading ? (
        <div>Loading...</div>
      ) : pendingBills.length === 0 ? (
        <div className="text-center py-10">No pending bills found.</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Coordinator</th>
              <th className="px-4 py-2 border-b">Site</th>
              <th className="px-4 py-2 border-b">Address</th>
              <th className="px-4 py-2 border-b">Educator</th>
              <th className="px-4 py-2 border-b">Student Count</th>
              <th className="px-4 py-2 border-b">Billable ($)</th>
              <th className="px-4 py-2 border-b">Hours</th>
              <th className="px-4 py-2 border-b">Expenses ($)</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingBills.map((bill) => (
              <tr key={bill.pkTrainingLogID}>
                <td className="px-4 py-2 border-b">
                  {bill.coordinator?.firstName} {bill.coordinator?.lastName}
                </td>
                <td className="px-4 py-2 border-b">{bill.sites?.SiteName || "N/A"}</td>
                <td className="px-4 py-2 border-b">
                  {bill.sites?.SiteCity}, {bill.sites?.SiteState} {bill.sites?.SiteZip}
                </td>
                <td className="px-4 py-2 border-b">
                  {bill.educators?.first} {bill.educators?.last}
                </td>
                <td className="px-4 py-2 border-b">
                  <input
                    type="number"
                    value={bill.studentCount || ""}
                    onChange={(e) =>
                      handleUpdateField(bill.pkTrainingLogID, "studentCount", e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input
                    type="number"
                    step="0.01"
                    value={bill.billable || ""}
                    onChange={(e) =>
                      handleUpdateField(bill.pkTrainingLogID, "billable", e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input
                    type="number"
                    value={bill.hours || ""}
                    onChange={(e) =>
                      handleUpdateField(bill.pkTrainingLogID, "hours", e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border-b">
                  <input
                    type="number"
                    step="0.01"
                    value={bill.expenses || ""}
                    onChange={(e) =>
                      handleUpdateField(bill.pkTrainingLogID, "expenses", e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border-b space-y-2">
                  {bill.studentCount === null && (
                    <button
                      onClick={() => handleOpenReminder(bill)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Reminder
                    </button>
                  )}
                  {bill.studentCount !== null && (
                    <button
                      onClick={() => handleBillClass(bill.pkTrainingLogID)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Bill
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {reminderEmail && (
        <Modal isOpen={!!reminderEmail} onClose={() => setReminderEmail(null)}>
          <div>
            <h2 className="text-xl font-bold mb-4">Send Reminder</h2>
            <p><strong>To:</strong> {reminderEmail.to}</p>
            <p><strong>Subject:</strong> {reminderEmail.subject}</p>
            <div className="border p-2 rounded-md whitespace-pre-line">
              {reminderEmail.html}
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={handleSendReminder}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send Email
              </button>
              <button
                onClick={() => setReminderEmail(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded ml-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PendingBill;
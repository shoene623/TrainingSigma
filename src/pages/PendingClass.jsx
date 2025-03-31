import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

const PendingClass = ({ userId }) => {
  const [pendingClasses, setPendingClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [classDate, setClassDate] = useState({}) // State to track class dates for each record

  useEffect(() => {
    const fetchPendingClasses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("pending_class")
          .select(`
            pktrainingclassid,
            class_type,
            preferred_date_start,
            preferred_date_end,
            status,
            notes,
            fkSiteID,
            fkEducatorID,
            queue_user_id,
            coordinator_id,
            offer_sent_at,
            educator_response_at,
            class_date,
            profiles_coordinator:coordinator_id (firstName, lastName),
            profiles_assigned:queue_user_id (firstName, lastName),
            sites:fkSiteID (
              SiteName,
              companies:fkCompID (CompName)
            ),
            educators:fkEducatorID (first, last)
          `)
          .order("preferred_date_start", { ascending: true })

        if (error) {
          console.error("Error fetching pending classes:", error)
        } else {
          
          setPendingClasses(data || [])
        }
      } catch (error) {
        console.error("Error fetching pending classes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingClasses()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleContactEducator = async (pktrainingclassid) => {
    try {
      const { error } = await supabase
        .from("pending_class")
        .update({
          status: "Awaiting Date", // Update status to "Awaiting Date"
          offer_sent_at: new Date().toISOString(), // Set the timestamp for offer_sent_at
        })
        .eq("pktrainingclassid", pktrainingclassid)

      if (error) throw error

      setPendingClasses((prev) =>
        prev.map((pendingClass) =>
          pendingClass.pktrainingclassid === pktrainingclassid
            ? { ...pendingClass, status: "Awaiting Date", offer_sent_at: new Date().toISOString() }
            : pendingClass
        )
      )
    } catch (error) {
      console.error("Error contacting educator:", error)
    }
  }

  const handleDateReceived = async (pktrainingclassid) => {
    if (!classDate[pktrainingclassid]) {
      alert("Please provide a class date before submitting.")
      return
    }

    try {
      const pendingClass = pendingClasses.find((pc) => pc.pktrainingclassid === pktrainingclassid)
      const coordinatorId = pendingClass?.coordinator_id

      if (!coordinatorId) {
        alert("Coordinator ID is missing for this class.")
        return
      }

      const { error } = await supabase
        .from("pending_class")
        .update({
          status: "Final Confirmation",
          educator_response_at: new Date().toISOString(),
          class_date: classDate[pktrainingclassid],
          queue_user_id: coordinatorId, 
        })
        .eq("pktrainingclassid", pktrainingclassid)

      if (error) throw error

      setPendingClasses((prev) =>
        prev.map((pendingClass) =>
          pendingClass.pktrainingclassid === pktrainingclassid
            ? {
                ...pendingClass,
                status: "Final Confirmation",
                educator_response_at: new Date().toISOString(),
                class_date: classDate[pktrainingclassid],
                queue_user_id: coordinatorId, // Update queue_user_id in the state
              }
            : pendingClass
        )
      )
    } catch (error) {
      console.error("Error updating final confirmation:", error)
    }
  }

  const handleConfirmDates = async (pktrainingclassid) => {
    try {
      const pendingClass = pendingClasses.find((pc) => pc.pktrainingclassid === pktrainingclassid)
  
      if (!pendingClass) {
        alert("Class not found.")
        return
      }
  
      // Move the class to the trainingLog table
      const { error: insertError } = await supabase.from("trainingLog").insert({
        subjects: pendingClass.class_type,
        dateofclass: pendingClass.class_date, 
        fkSiteID: pendingClass.fkSiteID,
        fkEducatorID: pendingClass.fkEducatorID,
        notes: pendingClass.notes,
        coordinator_id: pendingClass.coordinator_id,
        date_turned_in: pendingClass.date_turned_in
      })
  
      if (insertError) throw insertError
  
      // Remove the class from the pending_class table
      const { error: deleteError } = await supabase
        .from("pending_class")
        .delete()
        .eq("pktrainingclassid", pktrainingclassid)
  
      if (deleteError) throw deleteError
  
      setPendingClasses((prev) =>
        prev.filter((pendingClass) => pendingClass.pktrainingclassid !== pktrainingclassid)
      )
    } catch (error) {
      console.error("Error confirming dates:", error)
    }
  }

  const handleRemoveClass = async (pktrainingclassid) => {
    try {
      const { error } = await supabase
        .from("pending_class")
        .delete()
        .eq("pktrainingclassid", pktrainingclassid)

      if (error) throw error

      setPendingClasses((prev) =>
        prev.filter((pendingClass) => pendingClass.pktrainingclassid !== pktrainingclassid)
      )
    } catch (error) {
      console.error("Error removing class:", error)
    }
  }

  const handleClassDateChange = (pktrainingclassid, value) => {
    setClassDate((prev) => ({
      ...prev,
      [pktrainingclassid]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Pending Classes</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Class Type</th>
              <th className="px-4 py-2 border-b">Preferred Dates</th>
              <th className="px-4 py-2 border-b">Coordinator</th>
              <th className="px-4 py-2 border-b">Assigned To</th>
              <th className="px-4 py-2 border-b">Company</th>
              <th className="px-4 py-2 border-b">Site</th>
              <th className="px-4 py-2 border-b">Educator</th>
              <th className="px-4 py-2 border-b">Status</th>
              <th className="px-4 py-2 border-b">Class Date</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingClasses.map((pendingClass) => (
              <tr key={pendingClass.pktrainingclassid}>
                <td className="px-4 py-2 border-b">{pendingClass.class_type}</td>
                <td className="px-4 py-2 border-b">
                  {formatDate(pendingClass.preferred_date_start)} - {formatDate(pendingClass.preferred_date_end)}
                </td>
                <td className="px-4 py-2 border-b">
                  {pendingClass.profiles_coordinator?.firstName} {pendingClass.profiles_coordinator?.lastName}
                </td>
                <td className="px-4 py-2 border-b">
                  {pendingClass.profiles_assigned
                    ? `${pendingClass.profiles_assigned.firstName} ${pendingClass.profiles_assigned.lastName}`
                    : "Unassigned"}
                </td>
                <td className="px-4 py-2 border-b">
                  {pendingClass.sites?.companies?.CompName || "N/A"}
                </td>
                <td className="px-4 py-2 border-b">{pendingClass.sites?.SiteName || "N/A"}</td>
                <td className="px-4 py-2 border-b">
                  {pendingClass.educators?.first} {pendingClass.educators?.last}
                </td>
                <td className="px-4 py-2 border-b">{pendingClass.status || "N/A"}</td>
                <td className="px-4 py-2 border-b">
                  <input
                    type="date"
                    value={classDate[pendingClass.pktrainingclassid] || pendingClass.class_date || ""}
                    onChange={(e) => handleClassDateChange(pendingClass.pktrainingclassid, e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border-b space-y-2">
                  {pendingClass.status === "Confirm Educator Dates" && (
                    <button
                      onClick={() => handleContactEducator(pendingClass.pktrainingclassid)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Contact Educator
                    </button>
                  )}
                  {pendingClass.status === "Awaiting Date" && (
                    <button
                      onClick={() => handleDateReceived(pendingClass.pktrainingclassid)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Date Received
                    </button>
                  )}
                  {pendingClass.status === "Final Confirmation" && (
                    <button
                      onClick={() => handleConfirmDates(pendingClass.pktrainingclassid)}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Confirm / Add to TrainingLog
                    </button>
                  )}
                  {pendingClass.coordinator_id === userId && (
                    <button
                      onClick={() => handleRemoveClass(pendingClass.pktrainingclassid)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Remove Class
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PendingClass
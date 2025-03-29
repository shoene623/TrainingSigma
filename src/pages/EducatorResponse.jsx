"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

const EducatorResponse = () => {
  const { requestId } = useParams()
  const [status, setStatus] = useState("")
  const navigate = useNavigate()

  const handleResponse = async (response) => {
    try {
      const { error } = await supabase
        .from("pending_class")
        .update({
          status: response === "accept" ? "accepted" : "pending",
          educator_response_at: new Date().toISOString(),
        })
        .eq("pktrainingclassid", requestId)

      if (error) throw error

      navigate("/dashboard")
    } catch (error) {
      console.error("Error updating response:", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Respond to Class Offer</h1>
      <p>Do you accept this class offer?</p>
      <div className="flex gap-4">
        <Button onClick={() => handleResponse("accept")}>Accept</Button>
        <Button variant="destructive" onClick={() => handleResponse("decline")}>
          Decline
        </Button>
      </div>
    </div>
  )
}

export default EducatorResponse
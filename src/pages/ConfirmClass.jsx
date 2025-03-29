"use client"

import { useState } from "react"
import { supabase } from "../supabaseClient"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ConfirmClass = () => {
  const { requestId } = useParams()
  const [confirmedDate, setConfirmedDate] = useState("")
  const navigate = useNavigate()

  const handleConfirm = async () => {
    try {
      const { data, error } = await supabase
        .from("pending_class")
        .select("*")
        .eq("pktrainingclassid", requestId)
        .single()

      if (error) throw error

      const { error: insertError } = await supabase.from("trainingLog").insert({
        fkEducatorID: data.educator_id,
        fkSiteID: data.fksiteid,
        class_address: data.address,
        dateofclass: confirmedDate,
        class: data.class_type,
      })

      if (insertError) throw insertError

      await supabase
        .from("pending_class")
        .update({ status: "confirmed" })
        .eq("pktrainingclassid", requestId)

      navigate("/dashboard")
    } catch (error) {
      console.error("Error confirming class:", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Confirm Class</h1>
      <div>
        <label htmlFor="confirmedDate" className="block text-sm font-medium">
          Confirmed Date
        </label>
        <Input
          id="confirmedDate"
          type="date"
          value={confirmedDate}
          onChange={(e) => setConfirmedDate(e.target.value)}
          required
        />
      </div>
      <Button onClick={handleConfirm}>Confirm Class</Button>
    </div>
  )
}

export default ConfirmClass
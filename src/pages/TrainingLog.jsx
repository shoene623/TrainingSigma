import React, { useEffect, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { supabase } from "../supabaseClient"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"

export default function EditableTrainingTable() {
  const [data, setData] = useState([])
  const [updatingId, setUpdatingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [educators, setEducators] = useState([])
  const [coordinators, setCoordinators] = useState([])

  const fetchUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) console.error("User error", error)
    else setUser(user)
  }

  const fetchDropdownData = async () => {
    const [{ data: eds }, { data: coords }] = await Promise.all([
      supabase.from("educators").select("pkEducatorID, first, last").order("last"),
      supabase.from("profiles").select("firstName, lastName").eq("role", "LifeSafe")
    ])

    setEducators(eds ?? [])
    setCoordinators(
      (coords ?? []).map((c) => ({ fullName: `${c.firstName} ${c.lastName}` }))
    )
  }

  const fetchTrainingLog = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("trainingLog")
        .select("*")
        .order("last_updated", { ascending: false })
        .limit(25)

      if (error) throw error
      setData(data || [])
    } catch (error) {
      console.error("Error fetching training log:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateData = async (rowId, columnId, value) => {
    setUpdatingId(rowId)
    try {
      const { data: currentRow, error: fetchError } = await supabase
        .from("trainingLog")
        .select("locked_by_user_id")
        .eq("pkTrainingLogID", rowId)
        .single()

      if (fetchError) throw fetchError

      if (
        currentRow.locked_by_user_id &&
        currentRow.locked_by_user_id !== user?.id
      ) {
        alert("This row is currently locked by another user.")
        return
      }

      const { error } = await supabase
        .from("trainingLog")
        .update({
          [columnId]: value,
          last_updated: new Date().toISOString(),
          locked_by_user_id: user?.id,
        })
        .eq("pkTrainingLogID", rowId)

      if (error) throw error

      setData((old) =>
        old.map((row) =>
          row.pkTrainingLogID === rowId
            ? {
                ...row,
                [columnId]: value,
                last_updated: new Date().toISOString(),
                locked_by_user_id: user?.id,
              }
            : row
        )
      )
    } catch (error) {
      console.error("Error updating training log:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const columns = React.useMemo(() => {
    if (data.length === 0) return []

    const visibleKeys = Object.keys(data[0]).filter(
      (key) => !["pkTrainingLogID", "locked_by_user_id", "last_updated"].includes(key)
    )

    const cols = visibleKeys.map((key) => ({
      accessorKey: key,
      header: key,
      cell: EditableCell,
    }))

    cols.unshift({
      accessorKey: "locked_by_user_id",
      header: "🔒",
      cell: ({ row }) =>
        row.original.locked_by_user_id &&
        row.original.locked_by_user_id !== user?.id
          ? "🔒"
          : "",
    })

    return cols
  }, [data, user])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
      user,
      educators,
      coordinators,
    },
  })

  useEffect(() => {
    fetchUser()
    fetchDropdownData()
    fetchTrainingLog()
  }, [])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Training Log</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-auto max-h-[80vh]">
            <table className="min-w-full border border-gray-300">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-100">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-2 border text-xs text-left">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-yellow-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`p-2 border text-xs ${
                          row.original.pkTrainingLogID === updatingId
                            ? "bg-yellow-100"
                            : ""
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LocalizationProvider>
  )
}

function EditableCell({ getValue, row, column, table }) {
  const value = getValue()
  const [inputValue, setInputValue] = useState(value)

  const isDateField = ["date_turned_in", "date_sent_to_client", "date_materials_shipped"].includes(column.id)

  const onBlur = () => {
    if (inputValue !== value) {
      table.options.meta?.updateData(row.original.pkTrainingLogID, column.id, inputValue)
    }
  }

  if (isDateField) {
    return (
      <DatePicker
        value={inputValue ? dayjs(inputValue) : null}
        onChange={(newVal) => {
          const iso = newVal?.toISOString() ?? null
          setInputValue(iso)
          table.options.meta?.updateData(row.original.pkTrainingLogID, column.id, iso)
        }}
        slotProps={{ textField: { size: "small", fullWidth: true } }}
      />
    )
  }

  return (
    <input
      className="border px-2 py-1 w-full"
      value={inputValue ?? ""}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={onBlur}
    />
  )
}
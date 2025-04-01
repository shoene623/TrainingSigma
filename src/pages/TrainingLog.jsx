import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { supabase } from "../supabaseClient";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function EditableTrainingTable() {
  const [data, setData] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [educators, setEducators] = useState([]);
  const [coordinators, setCoordinators] = useState([]);

  const fetchUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error("User error", error);
    else setUser(user);
  };

  const fetchDropdownData = async () => {
    const [{ data: eds }, { data: coords }] = await Promise.all([
      supabase.from("educators").select("pkEducatorID, first, last").order("last"),
      supabase.from("profiles").select("firstName, lastName").eq("role", "LifeSafe"),
    ]);

    setEducators(eds ?? []);
    setCoordinators(
      (coords ?? []).map((c) => ({ fullName: `${c.firstName} ${c.lastName}` }))
    );
  };

  const fetchTrainingLog = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trainingLog")
        .select(`
          pkTrainingLogID,
          date_turned_in,
          date_sent_to_client,
          date_materials_shipped,
          three_day_educator_confirm_call_email,
          dateofclass,
          billdate,
          fkEducatorID,
          fkSiteID,
          Site:fkSiteID (
            SiteName,
            SiteAdd1,
            SiteCity,
            SiteState,
            SiteZip
          ),
          subjects,
          hours,
          locked_by_user_id,
          coordinator_id,
          educators:fkEducatorID (
            last
          ),
          notes,
          review,
          expenses
        `)
        .order("last_updated", { ascending: false })
        .limit(25);

      if (error) throw error;
      setData(data || []);
    } catch (error) {
      console.error("Error fetching training log:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (rowId, columnId, value) => {
    setUpdatingId(rowId);
    try {
      const { data: currentRow, error: fetchError } = await supabase
        .from("trainingLog")
        .select("locked_by_user_id")
        .eq("pkTrainingLogID", rowId)
        .single();

      if (fetchError) throw fetchError;

      if (
        currentRow.locked_by_user_id &&
        currentRow.locked_by_user_id !== user?.id
      ) {
        alert("This row is currently locked by another user.");
        return;
      }

      const { error } = await supabase
        .from("trainingLog")
        .update({
          [columnId]: value,
          last_updated: new Date().toISOString(),
          locked_by_user_id: user?.id,
        })
        .eq("pkTrainingLogID", rowId);

      if (error) throw error;

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
      );
    } catch (error) {
      console.error("Error updating training log:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportToCSV = () => {
    const csvRows = [];
    const headers = Object.keys(data[0] || {}).join(",");
    csvRows.push(headers);

    data.forEach((row) => {
      const values = Object.values(row).map((value) =>
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : value
      );
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "training_log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = React.useMemo(() => {
  if (data.length === 0) return [];

  const cols = [
    {
      accessorKey: "locked_by_user_id",
      header: "🔒",
      cell: ({ row }) =>
        row.original.locked_by_user_id &&
        row.original.locked_by_user_id !== user?.id
          ? "🔒"
          : "",
    },
    {
      accessorKey: "date_turned_in",
      header: "Date Turned In",
      cell: EditableCell,
    },
    {
      accessorKey: "date_sent_to_client",
      header: "Date Sent to Client",
      cell: EditableCell,
    },
    {
      accessorKey: "date_materials_shipped",
      header: "Date Materials Shipped",
      cell: EditableCell,
    },
    {
      accessorKey: "three_day_educator_confirm_call_email",
      header: "3 Day Educator Confirm",
      cell: EditableCell,
    },
    {
      accessorKey: "dateofclass",
      header: "Date of Class",
      cell: EditableCell,
    },
    {
      accessorKey: "billdate",
      header: "Bill Date",
      cell: EditableCell,
    },
    // Display Site Name
    {
      accessorKey: "Site.SiteName",
      header: "Site Name",
      cell: ({ getValue }) => <div>{getValue()}</div>,
    },
    // Display Site City
    {
      accessorKey: "Site.SiteCity",
      header: "Site City",
      cell: ({ getValue }) => <div>{getValue()}</div>,
    },
    // Display Educator Last Name
    {
      accessorKey: "educators.last",
      header: "Educator Last Name",
      cell: ({ getValue }) => <div>{getValue()}</div>,
    },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: EditableCell,
    },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: EditableCell,
    },
    {
      accessorKey: "coordinator_id",
      header: "Coordinator ID",
      cell: EditableCell,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: EditableCell,
    },
    {
      accessorKey: "review",
      header: "Review",
      cell: EditableCell,
    },
    {
      accessorKey: "expenses",
      header: "Expenses",
      cell: EditableCell,
    },
  ];

  return cols;
}, [data, user]);

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
  });

  useEffect(() => {
    fetchUser();
    fetchDropdownData();
    fetchTrainingLog();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Training Log</h1>
        <button
          onClick={exportToCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Export to CSV
        </button>
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
  );
}

function EditableCell({ getValue, row, column, table }) {
  const value = getValue();
  const [inputValue, setInputValue] = useState(value);

  const isDateField = ["date_turned_in", "date_sent_to_client", "date_materials_shipped"].includes(column.id);

  const onBlur = () => {
    if (inputValue !== value) {
      table.options.meta?.updateData(row.original.pkTrainingLogID, column.id, inputValue);
    }
  };

  if (isDateField) {
    return (
      <DatePicker
        value={inputValue ? dayjs(inputValue) : null}
        onChange={(newVal) => {
          const iso = newVal?.toISOString() ?? null;
          setInputValue(iso);
          table.options.meta?.updateData(row.original.pkTrainingLogID, column.id, iso);
        }}
        slotProps={{ textField: { size: "small", fullWidth: true } }}
      />
    );
  }

  return (
    <input
      className="border px-2 py-1 w-full"
      value={inputValue ?? ""}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={onBlur}
    />
  );
}
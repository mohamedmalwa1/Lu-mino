import { useMemo, useState } from "react";
import cx from "classnames";

/**
 * columns: [{ key:"first_name",  label:"First name" }, …]
 * rows:    [{ first_name:"Ali", id:7, …}, …]
 */
export default function DataTable({
  columns,
  rows,
  defaultSort = null,
  onBulkDelete = null,
}) {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [dir, setDir]         = useState("asc");
  const [selected, setSel]    = useState([]);

  /* ---------- derived rows (sorted) ------------------------------- */
  const view = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      return dir === "asc"
        ? aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        : aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });
  }, [rows, sortKey, dir]);

  /* ---------- helpers --------------------------------------------- */
  const toggleSelect = id =>
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleSort = key => {
    if (sortKey === key) setDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDir("asc"); }
  };

  /* ---------- render ---------------------------------------------- */
  if (!rows.length) return <p className="p-4 text-gray-600">No data.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            {onBulkDelete && (
              <th className="p-2 w-4">
                <input
                  type="checkbox"
                  checked={selected.length === rows.length}
                  onChange={() =>
                    setSel(selected.length === rows.length ? [] : rows.map(r => r.id))
                  }
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className={cx("p-2 text-left cursor-pointer select-none", {
                  "text-blue-600": sortKey === col.key,
                })}
                style={{ width: col.width }}
                onClick={() => toggleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (dir === "asc" ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {view.map((row, idx) => (
            <tr key={row.id ?? idx} className={idx % 2 ? "bg-gray-50" : ""}>
              {onBulkDelete && (
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </td>
              )}
              {columns.map(col => (
                <td key={col.key} className="p-2">
                  {typeof row[col.key] === "function"
                    ? row[col.key](row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {onBulkDelete && selected.length > 0 && (
        <button
          className="mt-3 px-4 py-2 rounded bg-red-600 text-white"
          onClick={() => { onBulkDelete(selected); setSel([]); }}
        >
          Delete {selected.length} selected
        </button>
      )}
    </div>
  );
}


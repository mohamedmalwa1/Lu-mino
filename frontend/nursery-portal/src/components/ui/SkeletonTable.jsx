export default function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="animate-pulse">
            {Array.from({ length: cols }).map((__, c) => (
              <td key={c} className="p-2">
                <div className="h-4 bg-gray-200 rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const { logout } = useAuth();
  return (
    <header className="border-b flex justify-between items-center px-6 py-3">
      <span />
      <button className="btn-primary" onClick={logout}>Logout</button>
    </header>
  );
}

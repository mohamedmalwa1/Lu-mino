import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const nav       = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err,  setErr]  = useState("");

  const submit = async e => {
    e.preventDefault();
    try {
      await login(form.username, form.password);
      nav("/");
    } catch {
      setErr("Invalid credentials");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={submit} className="card w-80 space-y-4">
        <h2 className="text-xl font-semibold text-center">Login</h2>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <input  className="input" placeholder="Username"
                value={form.username}
                onChange={e=>setForm({...form,username:e.target.value})}/>
        <input  className="input" placeholder="Password" type="password"
                value={form.password}
                onChange={e=>setForm({...form,password:e.target.value})}/>
        <button className="btn-primary w-full">Sign in</button>
      </form>
    </div>
  );
}

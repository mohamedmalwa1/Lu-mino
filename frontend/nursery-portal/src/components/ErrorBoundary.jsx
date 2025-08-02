import { Component } from "react";
import { toast } from "react-toastify";

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error(err); toast.error("Something went wrong."); }
  render() {
    return this.state.hasError
      ? <p className="text-red-600 p-6">Unexpected error — reload the page.</p>
      : this.props.children;
  }
}


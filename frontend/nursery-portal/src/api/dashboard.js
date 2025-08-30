import axios from "./axios";

// A single function to get all dashboard data
export const getDashboardAnalytics = () => 
  axios.get("/v1/core/dashboard/analytics/").then(r => r.data);

// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  FiUsers, FiFileText, FiCalendar, FiBook, FiClock,
  FiDollarSign, FiActivity, FiAlertCircle, FiTrendingUp,
  FiBarChart2, FiPlus, FiRefreshCw, FiPieChart
} from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from 'recharts';

// Color scheme
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E'];

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsMode, setAnalyticsMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Load data
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        students: { value: 187, trend: 'up', change: 12 },
        documents: { value: 56, trend: 'steady', change: 2 },
        classes: { value: 8, trend: 'up', change: 2 },
        attendance: { value: 92, trend: 'up', change: 3 },
        alerts: { value: 3, trend: 'down', change: 1 },
        revenue: { value: 12560, trend: 'up', change: 8 }
      });
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const showAnalytics = (section) => {
    setAnalyticsMode(section);
    setActiveTab('analytics');
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good {getTimeOfDay()}, <span className="text-indigo-600">{user?.name || 'Admin'}</span>!
          </h1>
          <p className="text-gray-500 mt-1">
            {getDashboardMessage(stats)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLoading(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-all"
          >
            <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Overview
        </button>
        <button
          onClick={() => analyticsMode && setActiveTab('analytics')}
          className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          disabled={!analyticsMode}
        >
          {analyticsMode ? `${analyticsMode} Analytics` : 'Analytics'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={<FiUsers className="text-indigo-600" size={24} />}
                title="Total Students"
                stat={stats?.students}
                loading={isLoading}
                color="indigo"
                onClick={() => showAnalytics('Students')}
              />
              <StatCard 
                icon={<FiBook className="text-emerald-600" size={24} />}
                title="Active Classes"
                stat={stats?.classes}
                loading={isLoading}
                color="emerald"
                onClick={() => showAnalytics('Classes')}
              />
              <StatCard 
                icon={<FiClock className="text-amber-600" size={24} />}
                title="Attendance Rate"
                stat={stats?.attendance}
                loading={isLoading}
                isPercentage={true}
                color="amber"
                onClick={() => showAnalytics('Attendance')}
              />
              <StatCard 
                icon={<FiDollarSign className="text-rose-600" size={24} />}
                title="Monthly Revenue"
                stat={stats?.revenue}
                loading={isLoading}
                isCurrency={true}
                color="rose"
                onClick={() => showAnalytics('Finance')}
              />
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ActionButton 
                  icon={<FiPlus size={20} />} 
                  label="Add Student"
                  onClick={() => console.log('Add Student')}
                />
                <ActionButton 
                  icon={<FiFileText size={20} />} 
                  label="New Document"
                  onClick={() => console.log('New Document')}
                />
                <ActionButton 
                  icon={<FiCalendar size={20} />} 
                  label="Schedule Event"
                  onClick={() => console.log('Schedule Event')}
                />
                <ActionButton 
                  icon={<FiTrendingUp size={20} />} 
                  label="View Analytics"
                  onClick={() => showAnalytics('Overview')}
                />
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { id: 1, icon: <FiUsers className="text-indigo-600" />, action: "New student enrolled", time: "10:30 AM", user: "Maria G." },
                  { id: 2, icon: <FiFileText className="text-emerald-600" />, action: "Medical form completed", time: "Yesterday", user: "James L." },
                  { id: 3, icon: <FiCalendar className="text-amber-600" />, action: "Parent meeting scheduled", time: "Yesterday", user: "You" },
                  { id: 4, icon: <FiDollarSign className="text-rose-600" />, action: "Tuition payment received", time: "Jul 12", user: "Auto" },
                ].map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start pb-4 border-b border-gray-100 last:border-0 group"
                  >
                    <div className="p-2 rounded-full bg-gray-100 mr-3 group-hover:bg-gray-200 transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{item.action}</p>
                      <div className="flex justify-between">
                        <p className="text-gray-500 text-sm">{item.time}</p>
                        <p className="text-gray-400 text-sm">{item.user}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{analyticsMode} Analytics</h2>
              <button 
                onClick={() => setActiveTab('overview')}
                className="text-indigo-600 hover:underline flex items-center"
              >
                ← Back to Overview
              </button>
            </div>

            {analyticsMode === 'Students' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnalyticsChart 
                    title="Age Group Distribution"
                    chart={
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Infants', value: 35 },
                              { name: 'Toddlers', value: 42 },
                              { name: 'Preschool', value: 60 },
                              { name: 'Pre-K', value: 50 }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    }
                  />
                  <AnalyticsChart 
                    title="Enrollment Trend"
                    chart={
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { month: 'Jan', enrollment: 30 },
                          { month: 'Feb', enrollment: 45 },
                          { month: 'Mar', enrollment: 60 },
                          { month: 'Apr', enrollment: 65 },
                          { month: 'May', enrollment: 80 },
                          { month: 'Jun', enrollment: 95 }
                        ]}>
                          <Bar dataKey="enrollment" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    }
                  />
                </div>
                <AnalyticsChart 
                  title="Monthly Attendance"
                  chart={
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={generateMonthlyData()}>
                        <defs>
                          <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="attendance"
                          stroke="#4F46E5"
                          fillOpacity={1}
                          fill="url(#colorAttendance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  }
                />
              </div>
            )}

            {analyticsMode === 'Finance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnalyticsChart 
                    title="Revenue Sources"
                    chart={
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Tuition', value: 85000 },
                              { name: 'Grants', value: 15000 },
                              { name: 'Donations', value: 5000 },
                              { name: 'Other', value: 10000 }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: $${(percent * 115000).toLocaleString()}`}
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    }
                  />
                  <AnalyticsChart 
                    title="Monthly Revenue"
                    chart={
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={generateFinancialData()}>
                          <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    }
                  />
                </div>
                <AnalyticsChart 
                  title="Annual Financial Trend"
                  chart={
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={generateAnnualTrendData()}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10B981"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  }
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Components
function StatCard({ icon, title, stat, loading, color, isPercentage, isCurrency, onClick }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-all h-full`}
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-8 w-1/2 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{title}</p>
              <p className="text-3xl font-bold mt-1 text-gray-900">
                {isPercentage ? (
                  <CountUp end={stat.value} suffix="%" duration={2.5} decimals={1} />
                ) : isCurrency ? (
                  <CountUp end={stat.value} prefix="$" duration={2.5} separator="," decimals={0} />
                ) : (
                  <CountUp end={stat.value} duration={2.5} separator="," />
                )}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                  {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'} {stat.change}%
                </span>
                <span className="text-gray-400 text-xs ml-2">vs last month</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${colorMap[color].bg} ${colorMap[color].text}`}>
              {icon}
            </div>
          </div>
          <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full`}
              style={{ backgroundColor: colorMap[color].text }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, stat.value)}%` }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
    >
      <div className="p-3 rounded-full bg-gray-100 group-hover:bg-indigo-100 text-gray-600 group-hover:text-indigo-600 transition-colors mb-2">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">
        {label}
      </span>
    </motion.button>
  );
}

function AnalyticsChart({ title, chart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
    >
      <h3 className="font-semibold mb-4">{title}</h3>
      {chart}
    </motion.div>
  );
}

// Helper functions
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function getDashboardMessage(stats) {
  if (!stats) return "Loading your dashboard...";
  
  const positiveStats = [
    stats.students.trend === 'up' && `${stats.students.change}% more students`,
    stats.attendance.trend === 'up' && `Attendance up ${stats.attendance.change}%`,
    stats.alerts.trend === 'down' && `${stats.alerts.change} fewer alerts`
  ].filter(Boolean);

  return positiveStats.length > 0 
    ? `You have ${positiveStats.join(', ')} this month`
    : "Everything is running smoothly";
}

function generateMonthlyData() {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    attendance: Math.floor(Math.random() * 30) + 70
  }));
}

function generateFinancialData() {
  return [
    { month: 'Jan', revenue: 15000 },
    { month: 'Feb', revenue: 18000 },
    { month: 'Mar', revenue: 22000 },
    { month: 'Apr', revenue: 19000 },
    { month: 'May', revenue: 21000 },
    { month: 'Jun', revenue: 25000 }
  ];
}

function generateAnnualTrendData() {
  return [
    { month: 'Jan', revenue: 15000 },
    { month: 'Feb', revenue: 18000 },
    { month: 'Mar', revenue: 22000 },
    { month: 'Apr', revenue: 19000 },
    { month: 'May', revenue: 21000 },
    { month: 'Jun', revenue: 25000 },
    { month: 'Jul', revenue: 28000 },
    { month: 'Aug', revenue: 26000 },
    { month: 'Sep', revenue: 30000 },
    { month: 'Oct', revenue: 32000 },
    { month: 'Nov', revenue: 35000 },
    { month: 'Dec', revenue: 40000 }
  ];
}

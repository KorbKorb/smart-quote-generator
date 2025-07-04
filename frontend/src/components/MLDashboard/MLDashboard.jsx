import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter
} from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Activity, Brain, Shield } from 'lucide-react';
import './MLDashboard.css';

const MLDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [realtimeData, setRealtimeData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    fetchMetrics();
    fetchAlerts();

    // Set up real-time updates
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ml-metrics');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };

    // Refresh metrics periodically
    const interval = setInterval(fetchMetrics, 60000); // Every minute

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [selectedTimeRange]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/ml/metrics?range=${selectedTimeRange}`);
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/ml/alerts?status=active');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleRealtimeUpdate = (data) => {
    if (data.type === 'metrics') {
      setRealtimeData(prev => [...prev.slice(-50), data.metrics]);
    } else if (data.type === 'alert') {
      setAlerts(prev => [data.alert, ...prev]);
    }
  };

  if (loading) {
    return (
      <div className="ml-dashboard-loading">
        <Activity className="loading-icon" />
        <h3>Loading ML Analytics...</h3>
      </div>
    );
  }

  const performanceData = metrics?.performance || [];
  const confusionMatrix = metrics?.confusionMatrix || {};
  const featureImportance = metrics?.featureImportance || [];
  const driftAnalysis = metrics?.driftAnalysis || [];
  const businessImpact = metrics?.businessImpact || {};

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const RISK_COLORS = {
    CRITICAL: '#FF4444',
    HIGH: '#FF8800',
    MEDIUM: '#FFBB33',
    LOW: '#00C851'
  };

  return (
    <div className="ml-dashboard">
      <div className="dashboard-header">
        <h1><Brain className="header-icon" /> ML Anomaly Detection Dashboard</h1>
        <div className="time-selector">
          <button 
            className={selectedTimeRange === '24h' ? 'active' : ''}
            onClick={() => setSelectedTimeRange('24h')}
          >
            24 Hours
          </button>
          <button 
            className={selectedTimeRange === '7d' ? 'active' : ''}
            onClick={() => setSelectedTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={selectedTimeRange === '30d' ? 'active' : ''}
            onClick={() => setSelectedTimeRange('30d')}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="alerts-banner">
          <AlertCircle className="alert-icon" />
          <span>{alerts.length} Active Alerts</span>
          <div className="alert-list">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className={`alert-item ${alert.severity.toLowerCase()}`}>
                <strong>{alert.severity}:</strong> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="Model Accuracy"
          value={`${(metrics?.accuracy * 100).toFixed(1)}%`}
          trend={metrics?.accuracyTrend}
          icon={<Brain />}
          color="#0088FE"
        />
        <MetricCard
          title="Anomalies Detected"
          value={metrics?.anomaliesDetected || 0}
          subtitle="Last 24 hours"
          icon={<AlertCircle />}
          color="#FF8042"
        />
        <MetricCard
          title="Prevented Losses"
          value={`$${(businessImpact.preventedLosses || 0).toLocaleString()}`}
          trend={businessImpact.trend}
          icon={<Shield />}
          color="#00C49F"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics?.avgLatency || 0}ms`}
          trend={metrics?.latencyTrend}
          icon={<Activity />}
          color="#FFBB28"
        />
      </div>

      {/* Performance Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Model Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#0088FE" name="Accuracy" />
              <Line type="monotone" dataKey="precision" stroke="#00C49F" name="Precision" />
              <Line type="monotone" dataKey="recall" stroke="#FFBB28" name="Recall" />
              <Line type="monotone" dataKey="f1Score" stroke="#8884D8" name="F1 Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Confusion Matrix</h3>
          <div className="confusion-matrix">
            <div className="matrix-cell header">Predicted</div>
            <div className="matrix-cell header">Normal</div>
            <div className="matrix-cell header">Anomaly</div>
            <div className="matrix-cell header">Normal</div>
            <div className="matrix-cell tn">{confusionMatrix.tn || 0}</div>
            <div className="matrix-cell fp">{confusionMatrix.fp || 0}</div>
            <div className="matrix-cell header">Anomaly</div>
            <div className="matrix-cell fn">{confusionMatrix.fn || 0}</div>
            <div className="matrix-cell tp">{confusionMatrix.tp || 0}</div>
          </div>
        </div>
      </div>

      {/* Feature Importance and Drift */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Top Feature Importance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance.slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="importance" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Feature Drift Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={driftAnalysis}>
              <PolarGrid />
              <PolarAngleAxis dataKey="feature" />
              <PolarRadiusAxis angle={90} domain={[0, 1]} />
              <Radar name="Current" dataKey="current" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
              <Radar name="Baseline" dataKey="baseline" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics?.riskDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(metrics?.riskDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Anomaly Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.anomalyCategories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8">
                {(metrics?.anomalyCategories || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Monitoring */}
      <div className="realtime-section">
        <h3>Real-time Anomaly Detection</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={realtimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="riskScore" 
              stroke="#ff7300" 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Insights */}
      <div className="insights-section">
        <h3>Model Insights & Recommendations</h3>
        <div className="insights-grid">
          {metrics?.insights?.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      </div>

      {/* Business Impact */}
      <div className="business-impact">
        <h3>Business Impact Summary</h3>
        <div className="impact-metrics">
          <div className="impact-metric">
            <span className="label">Total Quotes Analyzed</span>
            <span className="value">{businessImpact.totalQuotes || 0}</span>
          </div>
          <div className="impact-metric">
            <span className="label">Issues Prevented</span>
            <span className="value">{businessImpact.issuesPrevented || 0}</span>
          </div>
          <div className="impact-metric">
            <span className="label">False Positive Rate</span>
            <span className="value">{`${(businessImpact.falsePositiveRate * 100 || 0).toFixed(1)}%`}</span>
          </div>
          <div className="impact-metric highlight">
            <span className="label">ROI</span>
            <span className="value">{`${(businessImpact.roi * 100 || 0).toFixed(0)}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, subtitle, trend, icon, color }) => (
  <div className="metric-card" style={{ borderTop: `4px solid ${color}` }}>
    <div className="metric-header">
      <span className="metric-icon" style={{ color }}>{icon}</span>
      <span className="metric-title">{title}</span>
    </div>
    <div className="metric-value">{value}</div>
    {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    {trend && (
      <div className={`metric-trend ${trend > 0 ? 'up' : 'down'}`}>
        {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{Math.abs(trend).toFixed(1)}%</span>
      </div>
    )}
  </div>
);

const InsightCard = ({ insight }) => (
  <div className={`insight-card ${insight.priority.toLowerCase()}`}>
    <div className="insight-header">
      <span className="insight-priority">{insight.priority}</span>
      <span className="insight-category">{insight.category}</span>
    </div>
    <p className="insight-message">{insight.message}</p>
    {insight.action && (
      <div className="insight-action">
        <strong>Recommended Action:</strong> {insight.action}
      </div>
    )}
  </div>
);

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default MLDashboard;
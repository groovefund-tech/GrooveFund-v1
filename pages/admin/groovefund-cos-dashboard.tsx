import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Home, TrendingUp, Users, Settings, Bell, RefreshCw, Plus, 
  AlertCircle, CheckCircle, Zap, DollarSign, Target, Activity,
  TrendingDown, ArrowUp, ArrowDown, Play, Clock, Database,
  Send, Eye, Heart, MessageCircle, ChevronRight, Wifi, WifiOff
} from 'lucide-react';

const GrooveFundDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [energy, setEnergy] = useState(8);
  const [momentum, setMomentum] = useState(85);
  const [mrr, setMrr] = useState(100000);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Subtle random variations
      if (Math.random() > 0.7) {
        setMomentum(prev => Math.min(100, Math.max(70, prev + (Math.random() - 0.5) * 5)));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Mock data
  const energyData = [
    { day: 'Mon', energy: 7 },
    { day: 'Tue', energy: 8 },
    { day: 'Wed', energy: 6 },
    { day: 'Thu', energy: 9 },
    { day: 'Fri', energy: 8 },
    { day: 'Sat', energy: 9 },
    { day: 'Sun', energy: 8 },
  ];

  const revenueData = [
    { month: 'Sep', revenue: 78 },
    { month: 'Oct', revenue: 85 },
    { month: 'Nov', revenue: 92 },
    { month: 'Dec', revenue: 88 },
    { month: 'Jan', revenue: 95 },
    { month: 'Feb', revenue: 100 },
  ];

  const recentWins = [
    { emoji: '🎯', text: 'Sent 2 hot lead nudges, both replied!', time: '2 hours ago' },
    { emoji: '🚀', text: 'GrooveFund automation reduced manual work by 2hrs', time: '5 hours ago' },
    { emoji: '💰', text: 'Restaurant partnership added - 15% discount secured', time: '1 day ago' },
    { emoji: '📈', text: 'TikTok post hit 200k views', time: '2 days ago' },
    { emoji: '✨', text: 'Payment success rate reached 98%', time: '3 days ago' },
  ];

  const activeBlockers = [
    { id: 1, text: 'ER24 budget approval stuck at 38 days', action: 'Escalate to management' },
    { id: 2, text: 'Telegram notifications flaky', action: 'Switch to Slack primary' },
  ];

  const hotLeads = [
    { name: 'Thabo M.', signal: 'Leaderboard engaged', lastAction: 'Viewed leaderboard 5x today', score: 95 },
    { name: 'Naledi K.', signal: 'Event explorer', lastAction: 'Checked 3 upcoming concerts', score: 88 },
    { name: 'Sipho D.', signal: 'Payment reminder opened', lastAction: 'Opened payment email twice', score: 82 },
    { name: 'Zinhle P.', signal: 'Restaurant interest', lastAction: 'Asked about Groove Table', score: 78 },
    { name: 'Mandla S.', signal: 'High engagement', lastAction: 'Shared GrooveFund with friends', score: 85 },
  ];

  const restaurants = [
    { name: 'The Grillhouse', vouchers: 45, redeemed: 38, rate: 84 },
    { name: 'Rockets', vouchers: 32, redeemed: 29, rate: 91 },
    { name: 'Ocean Basket', vouchers: 28, redeemed: 18, rate: 64 },
    { name: 'RocoMamas', vouchers: 52, redeemed: 47, rate: 90 },
  ];

  const tiktokPosts = [
    { id: 1, views: 203000, engagement: 8.2, thumbnail: '🎭' },
    { id: 2, views: 156000, engagement: 7.5, thumbnail: '💰' },
    { id: 3, views: 89000, engagement: 6.8, thumbnail: '🚀' },
    { id: 4, views: 67000, engagement: 5.9, thumbnail: '🎯' },
    { id: 5, views: 45000, engagement: 7.1, thumbnail: '✨' },
    { id: 6, views: 38000, engagement: 6.4, thumbnail: '🔥' },
  ];

  const contentIdeas = [
    { 
      hook: 'Why stokvels are the OG DeFi', 
      format: 'Explainer + Stats', 
      angle: 'GrooveFund = modern stokvel tech',
      picked: false
    },
    { 
      hook: 'POV: You save R500/month for concerts', 
      format: 'POV skit', 
      angle: 'Show the GrooveFund experience',
      picked: true
    },
    { 
      hook: 'The real cost of FOMO buying concert tickets', 
      format: 'Educational breakdown', 
      angle: 'How GrooveFund prevents impulse buys',
      picked: false
    },
  ];

  const systemProcesses = [
    { name: 'morning-briefing', status: 'online', nextRun: '6:00 AM tomorrow' },
    { name: 'payment-monitor', status: 'online', nextRun: '5:00 PM today' },
    { name: 'intent-detection', status: 'online', nextRun: '6:00 PM today' },
    { name: 'response-bot', status: 'online', nextRun: 'Always running' },
  ];

  const notifications = [
    { channel: 'Telegram', status: 'warning', delivery: 'Flaky', lastError: '2 hours ago' },
    { channel: 'Slack', status: 'success', delivery: '100%', lastError: null },
    { channel: 'Email', status: 'success', delivery: '98%', lastError: null },
    { channel: 'SMS', status: 'success', delivery: '100%', lastError: null },
  ];

  const activityLog = [
    { time: '14:23', action: 'Hot lead nudge sent', status: 'success', user: 'Thabo M.' },
    { time: '13:45', action: 'Payment processed', status: 'success', user: 'Naledi K.' },
    { time: '12:30', action: 'Content idea picked', status: 'success', user: 'System' },
    { time: '11:15', action: 'Failed payment retry', status: 'success', user: 'Sipho D.' },
    { time: '10:20', action: 'New member onboarded', status: 'success', user: 'Zinhle P.' },
    { time: '09:05', action: 'Morning briefing sent', status: 'success', user: 'System' },
    { time: '08:42', action: 'Restaurant voucher issued', status: 'success', user: 'Mandla S.' },
    { time: '07:30', action: 'Payment reminder sent', status: 'success', user: 'Bulk action' },
  ];

  const StatCard = ({ icon: Icon, label, value, trend, color = 'orange' }) => (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        {trend && (
          <span className={`text-xs flex items-center gap-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Current Energy" value={`${energy}/10`} trend={12} />
        <StatCard icon={Activity} label="Today's Momentum" value={`${Math.round(momentum)}%`} trend={5} />
        <StatCard icon={DollarSign} label="GrooveFund MRR" value="R100k" trend={12} color="green" />
        <StatCard icon={Users} label="Active Members" value="200" trend={8} color="blue" />
      </div>

      {/* Energy Chart */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-400" />
          Energy Levels (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[0, 10]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Line 
              type="monotone" 
              dataKey="energy" 
              stroke="#FF751F" 
              strokeWidth={3}
              dot={{ fill: '#FF751F', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Wins */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Recent Wins
        </h3>
        <div className="space-y-3">
          {recentWins.map((win, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
              <span className="text-2xl">{win.emoji}</span>
              <div className="flex-1">
                <p className="text-white text-sm">{win.text}</p>
                <p className="text-gray-400 text-xs mt-1">{win.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Blockers */}
      {activeBlockers.length > 0 && (
        <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Active Blockers
          </h3>
          <div className="space-y-3">
            {activeBlockers.map((blocker) => (
              <div key={blocker.id} className="flex items-start justify-between gap-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium mb-1">{blocker.text}</p>
                  <p className="text-gray-400 text-xs">Suggested: {blocker.action}</p>
                </div>
                <button className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap">
                  Research This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGrooveFund = () => (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Revenue Performance
        </h3>
        <div className="text-4xl font-bold text-white mb-2">R100,000</div>
        <div className="text-sm text-gray-400 mb-6">Monthly Recurring Revenue (+12%)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              formatter={(value) => `R${value}k`}
            />
            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <Users className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-white">200</div>
          <div className="text-xs text-gray-400">Active Members</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <Target className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-2xl font-bold text-white">80</div>
          <div className="text-xs text-gray-400">Top 40% Members</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-xs text-gray-400">New This Week</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <Activity className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-white">2%</div>
          <div className="text-xs text-gray-400">Churn Rate</div>
        </div>
      </div>

      {/* Hot Leads */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Hot Leads (Intent Detection)
        </h3>
        <div className="space-y-3">
          {hotLeads.map((lead, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{lead.name}</span>
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                    {lead.score}% intent
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-1">{lead.signal}</p>
                <p className="text-gray-500 text-xs">{lead.lastAction}</p>
              </div>
              <button className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" />
                Nudge
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Restaurant Performance */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Restaurant Performance
        </h3>
        <div className="space-y-2">
          {restaurants.map((rest, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-4 rounded-lg ${
                rest.rate >= 85 ? 'bg-green-500/10 border border-green-500/20' : 
                rest.rate >= 70 ? 'bg-yellow-500/10 border border-yellow-500/20' : 
                'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <div className="flex-1">
                <div className="text-white font-medium">{rest.name}</div>
                <div className="text-gray-400 text-xs mt-1">
                  {rest.vouchers} issued • {rest.redeemed} redeemed
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  rest.rate >= 85 ? 'text-green-400' : 
                  rest.rate >= 70 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {rest.rate}%
                </div>
                <div className="text-gray-400 text-xs">redemption</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      {/* TikTok Performance */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-pink-400" />
            TikTok Performance
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">21.2k</span>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              +8%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {tiktokPosts.map((post) => (
            <div 
              key={post.id} 
              className={`bg-white/5 rounded-lg p-4 border transition-all hover:border-pink-400/50 ${
                post.views > 150000 ? 'border-pink-400/30' : 'border-white/10'
              }`}
            >
              <div className="text-4xl mb-2">{post.thumbnail}</div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Eye className="w-3 h-3" />
                {(post.views / 1000).toFixed(0)}k
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Heart className="w-3 h-3" />
                {post.engagement}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Ideas Queue */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Today's Content Ideas
        </h3>
        <div className="space-y-3">
          {contentIdeas.map((idea, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-lg border transition-all ${
                idea.picked 
                  ? 'bg-orange-500/10 border-orange-500/30' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="text-white font-medium mb-1">{idea.hook}</div>
                  <div className="text-gray-400 text-xs mb-2">
                    Format: {idea.format}
                  </div>
                  <div className="text-gray-500 text-xs">
                    GrooveFund Angle: {idea.angle}
                  </div>
                </div>
                {idea.picked ? (
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Picked
                  </span>
                ) : (
                  <button className="px-3 py-1 bg-white/10 text-white text-xs rounded-lg hover:bg-orange-500 transition-colors">
                    Pick This
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      {/* CoS Automations */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          CoS Automations Status
        </h3>
        <div className="space-y-3">
          {systemProcesses.map((process, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  process.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`} />
                <div>
                  <div className="text-white font-mono text-sm">{process.name}</div>
                  <div className="text-gray-400 text-xs mt-1">
                    Next run: {process.nextRun}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${
                process.status === 'online' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {process.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Delivery */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-400" />
          Notification Delivery
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notifications.map((notif, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-lg border ${
                notif.status === 'success' 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{notif.channel}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  notif.status === 'success' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {notif.delivery}
                </span>
              </div>
              {notif.lastError && (
                <div className="text-gray-400 text-xs">
                  Last error: {notif.lastError}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {activityLog.map((log, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
              <span className="text-gray-500 text-xs font-mono">{log.time}</span>
              <div className="flex-1">
                <span className="text-white text-sm">{log.action}</span>
                {log.user !== 'System' && (
                  <span className="text-gray-400 text-xs ml-2">• {log.user}</span>
                )}
              </div>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <Database className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-lg font-bold text-white">Healthy</div>
          <div className="text-xs text-gray-400">Supabase Status</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <Activity className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-lg font-bold text-white">1,234</div>
          <div className="text-xs text-gray-400">API Calls Today</div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
          <Database className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-lg font-bold text-white">45MB</div>
          <div className="text-xs text-gray-400">Storage Used</div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'groovefund', label: 'GrooveFund', icon: DollarSign },
    { id: 'content', label: 'Content', icon: Play },
    { id: 'system', label: 'System', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{getGreeting()}, Nene</h1>
            <p className="text-xs text-gray-400">
              {currentTime.toLocaleDateString('en-ZA', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
              N
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'groovefund' && renderGrooveFund()}
        {activeTab === 'content' && renderContent()}
        {activeTab === 'system' && renderSystem()}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <div className="hidden md:block fixed left-0 top-20 bottom-0 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-6">
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FAB for Quick Actions (Mobile) */}
      <button
        onClick={() => setShowFAB(!showFAB)}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showFAB && (
        <div className="md:hidden fixed bottom-40 right-4 space-y-3 z-40">
          {[
            { icon: Zap, label: 'Log Energy' },
            { icon: CheckCircle, label: 'Add Win' },
            { icon: AlertCircle, label: 'Report Blocker' },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                className="flex items-center gap-3 bg-slate-800 px-4 py-3 rounded-full shadow-xl hover:bg-slate-700 transition-all"
              >
                <Icon className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GrooveFundDashboard;
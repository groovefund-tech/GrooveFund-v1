import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Home, TrendingUp, Users, Settings, Bell, RefreshCw, Plus, 
  AlertCircle, CheckCircle, Zap, DollarSign, Target, Activity,
  ArrowUp, ArrowDown, Play, Clock, Database,
  Send, Eye, Heart, ChevronRight, Wifi, WifiOff
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [energy, setEnergy] = useState(8);
  const [momentum, setMomentum] = useState(85);

  // Check admin access
  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    }
  }

  // Real-time updates
  useEffect(() => {
    if (!isAuthorized) return
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (Math.random() > 0.7) {
        setMomentum(prev => Math.min(100, Math.max(70, prev + (Math.random() - 0.5) * 5)));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Checking access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  // Mock data (keeping it simple - you'll replace with real Supabase data later)
  const energyData = [
    { day: 'Mon', energy: 7 }, { day: 'Tue', energy: 8 }, { day: 'Wed', energy: 6 },
    { day: 'Thu', energy: 9 }, { day: 'Fri', energy: 8 }, { day: 'Sat', energy: 9 }, { day: 'Sun', energy: 8 }
  ];

  const recentWins = [
    { emoji: '🎯', text: 'Sent 2 hot lead nudges, both replied!', time: '2 hours ago' },
    { emoji: '🚀', text: 'GrooveFund automation reduced manual work by 2hrs', time: '5 hours ago' },
    { emoji: '💰', text: 'Restaurant partnership added', time: '1 day ago' }
  ];

  const StatCard = ({ icon: Icon, label, value, trend }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    trend?: number;
  }) => (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-orange-400" />
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
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Zap} label="Current Energy" value={`${energy}/10`} trend={12} />
            <StatCard icon={Activity} label="Today's Momentum" value={`${Math.round(momentum)}%`} trend={5} />
            <StatCard icon={DollarSign} label="GrooveFund MRR" value="R100k" trend={12} />
            <StatCard icon={Users} label="Active Members" value="200" trend={8} />
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
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

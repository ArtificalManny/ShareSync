import React from 'react';
import { Rocket, Target, Zap, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../common/Card';

const StatMini = ({ icon: Icon, label, value, status }) => {
  const statusColors = {
    brand: "text-purple-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };
  
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:scale-[1.02]">
      <Icon className={`w-4 h-4 ${statusColors[status] || 'text-slate-400'}`} />
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
    </div>
  );
};

export default function YourWorld() {
  return (
    <Card variant="elevated" status="brand" glow className="overflow-hidden">
      <CardHeader className="flex items-center justify-between bg-purple-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600 shadow-lg shadow-purple-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your World</h2>
            <p className="text-xs text-slate-500">Real-time mission status</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">A+ Momentum</span>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatMini icon={Rocket} label="Active" value="3" status="brand" />
          <StatMini icon={Target} label="Ships Today" value="5" status="success" />
          <StatMini icon={Zap} label="Streaks" value="2" status="warning" />
          <StatMini icon={AlertTriangle} label="At Risk" value="1" status="danger" />
          <StatMini icon={DollarSign} label="Revenue" value="$2.4k" status="success" />
        </div>
      </CardBody>
    </Card>
  );
}

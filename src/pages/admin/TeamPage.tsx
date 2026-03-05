import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, UserPlus, Loader2, Trash2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  email?: string;
};

const TeamPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [adding, setAdding] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const handleInvite = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    toast({
      title: 'আমন্ত্রণ পাঠানো হবে',
      description: `${newEmail} কে ${newRole === 'admin' ? 'ফুল অ্যাডমিন' : 'অর্ডার ম্যানেজার'} হিসেবে যোগ করতে প্রথমে তাকে রেজিস্ট্রেশন করতে হবে।`,
    });
    setNewEmail('');
    setAdding(false);
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h2 className="text-lg font-semibold text-foreground">টিম ম্যানেজমেন্ট</h2>
        <p className="text-[11px] text-muted-foreground">সাব-অ্যাডমিন যোগ করুন ও পারমিশন নিয়ন্ত্রণ করুন</p>
      </div>

      {/* Add Member */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-accent" /> নতুন সদস্য যোগ করুন
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="ইমেইল অ্যাড্রেস"
            type="email"
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
          <select
            value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'user')}
            className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          >
            <option value="admin">ফুল অ্যাডমিন</option>
            <option value="user">অর্ডার ম্যানেজার</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={adding || !newEmail.trim()}
            className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            যোগ করুন
          </button>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-accent" />
            <h4 className="font-semibold text-sm">ফুল অ্যাডমিন</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">সব ফিচারে সম্পূর্ণ অ্যাক্সেস — প্রোডাক্ট, অর্ডার, সেটিংস, টিম।</p>
        </div>
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-info" />
            <h4 className="font-semibold text-sm">অর্ডার ম্যানেজার</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">শুধু অর্ডার দেখা ও স্ট্যাটাস আপডেট করতে পারবেন। অন্য কিছু পরিবর্তন করতে পারবেন না।</p>
        </div>
      </div>

      {/* Current Team */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/60">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-info" /> বর্তমান টিম
          </h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
        ) : !members?.length ? (
          <div className="p-8 text-center text-muted-foreground text-sm">কোনো টিম মেম্বার নেই।</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User ID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">রোল</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">স্ট্যাটাস</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id} className="hover:bg-muted/30 border-b border-border/40">
                  <TableCell className="font-mono text-xs text-foreground">{m.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                      m.role === 'admin' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-info/10 text-info border-info/20'
                    }`}>
                      {m.role === 'admin' ? 'ফুল অ্যাডমিন' : 'অর্ডার ম্যানেজার'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {m.user_id === user?.id ? (
                      <span className="text-[10px] text-success font-medium">আপনি</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">অ্যাক্টিভ</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default TeamPage;

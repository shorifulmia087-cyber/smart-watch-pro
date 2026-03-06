import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, UserPlus, Loader2, Crown, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    try {
      const { data, error } = await supabase.rpc('add_team_member', {
        _email: newEmail.trim(),
        _role: newRole,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; user_id?: string };

      if (result.success) {
        toast({
          title: '✅ সফলভাবে যোগ করা হয়েছে',
          description: `${newEmail} কে ${newRole === 'admin' ? 'ফুল অ্যাডমিন' : 'অর্ডার ম্যানেজার'} হিসেবে যোগ করা হয়েছে।`,
        });
        setNewEmail('');
        // Refetch team members
        queryClient.invalidateQueries({ queryKey: ['team-members'] });
      } else if (result.error === 'user_not_found') {
        toast({
          title: '❌ ইউজার পাওয়া যায়নি',
          description: `${newEmail} দিয়ে কোনো ভেরিফাইড অ্যাকাউন্ট পাওয়া যায়নি। প্রথমে এই ইমেইল দিয়ে সাইনআপ ও ইমেইল ভেরিফিকেশন সম্পন্ন করতে হবে।`,
          variant: 'destructive',
        });
      } else if (result.error === 'already_exists') {
        toast({
          title: '⚠️ আগে থেকেই আছে',
          description: `${newEmail} ইতিমধ্যে এই রোলে যোগ করা আছে।`,
        });
      } else if (result.error === 'permission_denied') {
        toast({
          title: '❌ অনুমতি নেই',
          description: 'শুধু সুপার অ্যাডমিন টিম মেম্বার যোগ করতে পারেন।',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'ত্রুটি',
        description: err.message || 'কিছু একটা সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-[1000px]">
      {/* Bento Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <h2 className="text-lg font-bold text-foreground">টিম ম্যানেজমেন্ট</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">সাব-অ্যাডমিন যোগ করুন ও পারমিশন নিয়ন্ত্রণ করুন</p>
      </div>

      {/* Add Member */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 md:p-6 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
          <UserPlus className="h-4 w-4 text-gold" /> নতুন সদস্য যোগ করুন
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="ইমেইল অ্যাড্রেস"
            type="email"
            className="flex-1 bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
          />
          <select
            value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'user')}
            className="bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
          >
            <option value="admin">ফুল অ্যাডমিন</option>
            <option value="user">অর্ডার ম্যানেজার</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={adding || !newEmail.trim()}
            className="gradient-gold text-white font-semibold px-6 py-2.5 rounded-sm text-sm hover:opacity-90 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            style={{ boxShadow: '0 4px 12px -4px hsl(var(--gold) / 0.3)' }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            যোগ করুন
          </button>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" />
            <h4 className="font-semibold text-sm text-foreground">ফুল অ্যাডমিন</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">সব ফিচারে সম্পূর্ণ অ্যাক্সেস — প্রোডাক্ট, অর্ডার, সেটিংস, টিম।</p>
        </div>
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-info" />
            <h4 className="font-semibold text-sm text-foreground">অর্ডার ম্যানেজার</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">শুধু অর্ডার দেখা ও স্ট্যাটাস আপডেট করতে পারবেন। অন্য কিছু পরিবর্তন করতে পারবেন না।</p>
        </div>
      </div>

      {/* Current Team */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border/30">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
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
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User ID</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">রোল</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">স্ট্যাটাস</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id} className="hover:bg-gold/[0.03] border-b border-border/30">
                  <TableCell className="font-mono text-xs text-foreground">{m.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-sm border ${
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

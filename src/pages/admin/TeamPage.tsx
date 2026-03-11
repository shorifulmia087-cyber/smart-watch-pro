import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, UserPlus, Loader2, Crown, Trash2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
};

const TeamPage = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('order_manager');
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

  // Super admin = first admin by created_at
  const superAdminId = members
    ?.filter(m => m.role === 'admin')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.user_id;

  // Available roles based on caller's role
  const availableRoles = isSuperAdmin
    ? [
        { value: 'admin', label: 'অ্যাডমিন' },
        { value: 'order_manager', label: 'অর্ডার ম্যানেজার' },
      ]
    : [
        { value: 'order_manager', label: 'অর্ডার ম্যানেজার' },
      ];

  const handleInvite = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase.rpc('add_team_member', {
        _email: newEmail.trim(),
        _role: newRole as any,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; user_id?: string };
      const roleLabel = newRole === 'admin' ? 'অ্যাডমিন' : 'অর্ডার ম্যানেজার';

      if (result.success) {
        toast({
          title: '✅ সফলভাবে যোগ করা হয়েছে',
          description: `${newEmail} কে ${roleLabel} হিসেবে যোগ করা হয়েছে।`,
        });
        setNewEmail('');
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
          description: isSuperAdmin
            ? 'কিছু একটা সমস্যা হয়েছে।'
            : 'শুধু সুপার অ্যাডমিন অ্যাডমিন যোগ করতে পারেন। আপনি শুধু অর্ডার ম্যানেজার যোগ করতে পারেন।',
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

  const handleRemove = async (targetUserId: string) => {
    if (!confirm('আপনি কি নিশ্চিত এই সদস্যকে রিমুভ করতে চান?')) return;
    setRemovingId(targetUserId);
    try {
      const { data, error } = await supabase.rpc('remove_team_member', { _user_id: targetUserId });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast({ title: '✅ সফলভাবে রিমুভ করা হয়েছে' });
        queryClient.invalidateQueries({ queryKey: ['team-members'] });
      } else if (result.error === 'cannot_remove_super_admin') {
        toast({ title: '❌ সুপার অ্যাডমিন রিমুভ করা যাবে না', variant: 'destructive' });
      } else if (result.error === 'permission_denied') {
        toast({ title: '❌ অনুমতি নেই', description: 'আপনি শুধু অর্ডার ম্যানেজার রিমুভ করতে পারেন।', variant: 'destructive' });
      } else {
        toast({ title: '❌ ত্রুটি', description: result.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  const getRoleBadge = (m: TeamMember) => {
    if (m.user_id === superAdminId) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-gold/10 text-gold border-gold/20">
          <Crown className="h-3 w-3" /> সুপার অ্যাডমিন
        </span>
      );
    }
    if (m.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-accent/10 text-accent border-accent/20">
          <ShieldCheck className="h-3 w-3" /> অ্যাডমিন
        </span>
      );
    }
    if (m.role === 'order_manager') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-info/10 text-info border-info/20">
          <Shield className="h-3 w-3" /> অর্ডার ম্যানেজার
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-muted/20 text-muted-foreground border-border/30">
        ইউজার
      </span>
    );
  };

  const canRemove = (m: TeamMember) => {
    // Can't remove super admin
    if (m.user_id === superAdminId) return false;
    // Can't remove yourself
    if (m.user_id === user?.id) return false;
    // Super admin can remove anyone (except themselves)
    if (isSuperAdmin) return true;
    // Admin can only remove order_managers
    if (isAdmin && m.role === 'order_manager') return true;
    return false;
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <h2 className="text-lg font-bold text-foreground">টিম ম্যানেজমেন্ট</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {isSuperAdmin ? 'অ্যাডমিন ও অর্ডার ম্যানেজার যোগ করুন' : 'অর্ডার ম্যানেজার যোগ করুন ও পারমিশন নিয়ন্ত্রণ করুন'}
        </p>
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
            value={newRole} onChange={e => setNewRole(e.target.value)}
            className="bg-muted/30 border border-border/40 rounded-sm px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
          >
            {availableRoles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" />
            <h4 className="font-semibold text-sm text-foreground">সুপার অ্যাডমিন</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">সম্পূর্ণ নিয়ন্ত্রণ — অ্যাডমিন ও অর্ডার ম্যানেজার যোগ/রিমুভ, ডেভেলপার ফিল্ড এডিট। পরিবর্তন অযোগ্য।</p>
        </div>
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h4 className="font-semibold text-sm text-foreground">অ্যাডমিন</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">সব ফিচারে অ্যাক্সেস — প্রোডাক্ট, অর্ডার, সেটিংস। অর্ডার ম্যানেজার যোগ/রিমুভ করতে পারবেন।</p>
        </div>
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-info" />
            <h4 className="font-semibold text-sm text-foreground">অর্ডার ম্যানেজার</h4>
          </div>
          <p className="text-[11px] text-muted-foreground">শুধু অর্ডার দেখা, স্ট্যাটাস আপডেট ও ট্র্যাকিং। অন্য কিছু পরিবর্তন করতে পারবেন না।</p>
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
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">User ID</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">রোল</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-center">স্ট্যাটাস</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 text-center">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id} className="hover:bg-gold/[0.03] border-b border-border/30">
                  <TableCell className="font-mono text-xs text-foreground">{m.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>{getRoleBadge(m)}</TableCell>
                  <TableCell className="text-center">
                    {m.user_id === user?.id ? (
                      <span className="text-[10px] text-success font-medium">আপনি</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">অ্যাক্টিভ</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {canRemove(m) && (
                      <button
                        onClick={() => handleRemove(m.user_id)}
                        disabled={removingId === m.user_id}
                        className="text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                        title="রিমুভ করুন"
                      >
                        {removingId === m.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
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

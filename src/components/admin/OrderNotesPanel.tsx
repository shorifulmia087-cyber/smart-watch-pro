import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';

interface Note {
  id: string;
  note: string;
  created_at: string;
  created_by: string;
}

const OrderNotesPanel = ({ orderId }: { orderId: string }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('order_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    setNotes((data as Note[]) || []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) { setSubmitting(false); return; }

    await supabase.from('order_notes').insert({
      order_id: orderId,
      note: newNote.trim(),
      created_by: userId,
    });
    setNewNote('');
    await fetchNotes();
    setSubmitting(false);
  };

  const deleteNote = async (id: string) => {
    await supabase.from('order_notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" /> নোট ({notes.length})
      </h4>

      {/* Add note */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
          placeholder="নোট লিখুন..."
          className="flex-1 bg-muted/30 border border-border/40 rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
        <button
          onClick={addNote}
          disabled={submitting || !newNote.trim()}
          className="p-2 rounded-sm gradient-gold text-white hover:opacity-90 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-3">কোনো নোট নেই</p>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {notes.map(n => (
            <div key={n.id} className="flex items-start gap-2 bg-muted/20 border border-border/20 rounded-sm p-2.5 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{n.note}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString('bn-BD')}
                </p>
              </div>
              <button
                onClick={() => deleteNote(n.id)}
                className="p-1 rounded-sm text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderNotesPanel;

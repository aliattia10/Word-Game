import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { GameRoom } from './components/GameRoom';
import { JoinRoom } from './components/JoinRoom';

export default function App() {
  const [session, setSession] = useState(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {!roomId ? (
        <JoinRoom onJoinRoom={setRoomId} />
      ) : (
        <GameRoom roomId={roomId} onLeaveRoom={() => setRoomId(null)} />
      )}
    </div>
  );
}
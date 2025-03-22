import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Users, Crown, X, Send } from 'lucide-react';
import Confetti from 'react-confetti';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface GameRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

interface Player {
  name: string;
  score: number;
}

interface GameRoom {
  id: string;
  host: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  current_letter?: string;
  current_round?: number;
}

interface PresenceEvent {
  key: string;
  newPresences?: any[];
  leftPresences?: any[];
}

export function GameRoom({ roomId, onLeaveRoom }: GameRoomProps) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(120);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playerName, setPlayerName] = useState<string>('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize player name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: any;

    const initializeRoom = async () => {
      try {
        // Initial room fetch
        const { data: roomData, error: roomError } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError) throw roomError;
        if (!mounted) return;

        console.log('Initial room data:', roomData);
        setRoom(roomData);

        // Set up real-time subscription with presence
        const channel = supabase.channel(`room:${roomId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: playerName },
          },
        });

        // Handle presence updates
        channel
          .on('presence', { event: 'sync' }, () => {
            console.log('Presence sync event received');
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }: PresenceEvent) => {
            console.log('Player joined:', key, newPresences);
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }: PresenceEvent) => {
            console.log('Player left:', key, leftPresences);
          });

        // Handle room updates
        subscription = channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'game_rooms',
              filter: `id=eq.${roomId}`,
            },
            (payload: RealtimePostgresChangesPayload<GameRoom>) => {
              console.log('Received room update:', payload);
              if (!mounted) return;

              if (payload.new) {
                const newRoom = payload.new;
                setRoom(newRoom);

                // Handle game state changes
                if (payload.old?.status !== 'playing' && newRoom.status === 'playing') {
                  console.log('Game started!');
                  toast.success('Game started!');
                  setTimeLeft(120);
                } else if (newRoom.status === 'finished') {
                  console.log('Game finished!');
                  setShowConfetti(true);
                  setTimeout(() => setShowConfetti(false), 5000);
                }
              }
            }
          )
          .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR') => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to room updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel subscription error');
              toast.error('Failed to connect to room updates');
            }
          });

        channelRef.current = channel;

      } catch (error) {
        console.error('Error initializing room:', error);
        toast.error('Failed to connect to room');
      }
    };

    initializeRoom();

    return () => {
      mounted = false;
      if (subscription) {
        console.log('Cleaning up subscription');
        subscription.unsubscribe();
      }
      if (channelRef.current) {
        console.log('Cleaning up channel');
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId, playerName]);

  useEffect(() => {
    let timer: number;
    if (room?.status === 'playing' && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            handleTimeUp();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [room?.status, timeLeft]);

  const handleTimeUp = async () => {
    if (!room) return;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'finished' })
        .eq('id', roomId);

      if (error) throw error;
      toast.success('Time\'s up! Game finished.');
    } catch (error) {
      console.error('Error ending game:', error);
      toast.error('Failed to end game');
    }
  };

  const startGame = async () => {
    if (!room || !playerName) {
      console.error('Cannot start game: room or player name missing');
      return;
    }

    if (room.players.length < 2) {
      toast.error('Need at least 2 players to start the game');
      return;
    }

    try {
      console.log('Starting game...');
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];

      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: 'playing',
          current_letter: randomLetter,
          current_round: 1,
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error starting game:', error);
        throw error;
      }

      console.log('Game started successfully with letter:', randomLetter);
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game. Please try again.');
    }
  };

  const submitAnswers = async () => {
    if (!room || !playerName) {
      console.error('Cannot submit answers: room or player name missing');
      return;
    }

    if (room.status !== 'playing') {
      console.error('Cannot submit answers: game is not in progress');
      return;
    }

    if (Object.values(answers).some(answer => !answer.trim())) {
      toast.error('Please fill in all categories');
      return;
    }

    try {
      console.log('Submitting answers...');
      const updatedPlayers = room.players.map(player => {
        if (player.name === playerName) {
          return {
            ...player,
            score: player.score + Object.values(answers).length
          };
        }
        return player;
      });

      const { error } = await supabase
        .from('game_rooms')
        .update({ players: updatedPlayers })
        .eq('id', roomId);

      if (error) {
        console.error('Error submitting answers:', error);
        throw error;
      }

      console.log('Answers submitted successfully');
      toast.success('Answers submitted!');
      setAnswers({});
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast.error('Failed to submit answers. Please try again.');
    }
  };

  const leaveRoom = async () => {
    if (!room || !playerName) {
      console.error('Cannot leave room: room or player name missing');
      return;
    }

    try {
      console.log('Leaving room...');
      const updatedPlayers = room.players.filter(p => p.name !== playerName);

      if (updatedPlayers.length === 0) {
        console.log('No players left, deleting room');
        const { error } = await supabase
          .from('game_rooms')
          .delete()
          .eq('id', roomId);

        if (error) {
          console.error('Error deleting room:', error);
          throw error;
        }
      } else {
        console.log('Updating room with remaining players');
        const newHost = room.host === playerName ? updatedPlayers[0].name : room.host;
        const { error } = await supabase
          .from('game_rooms')
          .update({
            players: updatedPlayers,
            host: newHost,
            // Reset game state if host leaves during a game
            ...(room.host === playerName && {
              status: 'waiting',
              current_letter: null,
              current_round: 1
            })
          })
          .eq('id', roomId);

        if (error) {
          console.error('Error updating room:', error);
          throw error;
        }
      }

      // Clean up subscriptions
      if (channelRef.current) {
        console.log('Cleaning up channel subscription');
        await channelRef.current.unsubscribe();
      }

      console.log('Successfully left room');
      onLeaveRoom();
    } catch (error) {
      console.error('Error leaving room:', error);
      toast.error('Failed to leave room. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isHost = room.host === playerName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      {showConfetti && <Confetti />}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-4xl"
      >
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
          <div className="flex justify-between items-center mb-8">
            <motion.h2
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-2xl font-bold text-gray-800"
            >
              Room: {roomId}
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={leaveRoom}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Leave Room
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Players ({room.players.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <AnimatePresence>
                {room.players.map((player, index) => (
                  <motion.div
                    key={player.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2 ${
                      player.name === room.host ? 'border-2 border-yellow-400' : ''
                    }`}
                  >
                    {player.name === room.host && (
                      <Crown className="text-yellow-500 w-4 h-4" />
                    )}
                    <span>{player.name}</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                      {player.score}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {room.status === 'waiting' && isHost && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startGame}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Game
            </motion.button>
          )}

          {room.status === 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold text-gray-700">
                    Current Letter:
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg"
                  >
                    {room.current_letter}
                  </motion.div>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
                  <Timer className="text-gray-600" />
                  <span className="text-xl font-mono font-semibold text-gray-800">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {['Animal', 'Country', 'Food', 'Name'].map((category, index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2">
                      <h3 className="text-white font-medium">{category}</h3>
                    </div>
                    <div className="p-4">
                      <input
                        type="text"
                        value={answers[category] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [category]: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                        placeholder={`Enter a ${category}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitAnswers}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Answers
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
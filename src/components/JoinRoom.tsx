import { useState } from 'react';
import { nanoid } from 'nanoid';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Sparkles, Users, Gamepad2 } from 'lucide-react';

interface JoinRoomProps {
  onJoinRoom: (roomId: string) => void;
}

export function JoinRoom({ onJoinRoom }: JoinRoomProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    const roomId = nanoid(6);
    const { error } = await supabase
      .from('game_rooms')
      .insert([
        {
          id: roomId,
          host: playerName,
          players: [{ name: playerName, score: 0 }],
          status: 'waiting',
        },
      ]);

    setIsLoading(false);
    if (error) {
      toast.error('Failed to create room');
      return;
    }

    onJoinRoom(roomId);
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomCode)
      .single();

    if (error || !data) {
      setIsLoading(false);
      toast.error('Room not found');
      return;
    }

    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        players: [...data.players, { name: playerName, score: 0 }],
      })
      .eq('id', roomCode);

    setIsLoading(false);
    if (updateError) {
      toast.error('Failed to join room');
      return;
    }

    onJoinRoom(roomCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            WordSprint
          </h1>
          <p className="text-gray-600 mt-2">Challenge your friends in real-time!</p>
        </motion.div>
        
        <div className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="pl-10 w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                placeholder="Enter your name"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Code (optional)
            </label>
            <div className="relative">
              <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="pl-10 w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                placeholder="Enter room code to join"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={createRoom}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create New Room'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={joinRoom}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
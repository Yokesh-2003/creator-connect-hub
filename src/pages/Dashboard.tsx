import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';

export default function Dashboard() {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // This guard is now safe because `loading` will be true until the session is resolved.
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [session, loading, navigate]);

  // CRITICAL: Render a loading state until authentication is resolved.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Welcome to your Dashboard</h1>
          <p className="text-muted-foreground">Your session is valid and you are logged in.</p>
          {user && (
            <pre className="mt-4 p-4 bg-card border rounded-lg text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          )}
        </motion.div>
      </main>
    </div>
  );
}

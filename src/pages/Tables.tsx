import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Tables = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Tuck Shop doesn't have tables — redirect directly to the main counter POS screen
    navigate('/order', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-background text-muted-foreground text-sm">
      Redirecting to Tuck Shop Counter POS...
    </div>
  );
};

export default Tables;

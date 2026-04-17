import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome, {user.firstName}!</h1>
        <p className="text-gray-500 mb-6">You have successfully logged in to Portfoliomate.</p>
        
        <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left text-sm">
          <p><strong>Email:</strong> {user.emailId}</p>
          <p><strong>Firm ID:</strong> {user.firmId}</p>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-lg flex items-center justify-center transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
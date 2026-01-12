import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Settings } from 'lucide-react';

export default function ProfileCompleteModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show modal if user logged in but company name is empty
    if (user && (!user.companyName || user.companyName.trim() === '')) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [user]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="text-yellow-500" size={40} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h3>
            <p className="text-gray-700 mb-4">
              Please complete your company profile to get started. We need your
              company name and state to provide accurate carbon emission calculations.
            </p>
            <button
              onClick={() => {
                setShow(false);
                navigate('/settings');
              }}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              Complete Profile Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

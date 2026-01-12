import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, Building, Eye, EyeOff } from 'lucide-react';

const US_STATES = [
  { code: 'CA', name: 'California' },
  { code: 'NY', name: 'New York' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'IL', name: 'Illinois' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'OH', name: 'Ohio' },
  { code: 'GA', name: 'Georgia' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'OR', name: 'Oregon' },
  { code: 'WA', name: 'Washington' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'VT', name: 'Vermont' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'WV', name: 'West Virginia' },
];

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Custom validation messages (English)
    const form = e.target as HTMLFormElement;
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach((input: any) => {
      if (input.validity.valueMissing) {
        input.setCustomValidity('Please fill in this field');
      } else if (input.validity.typeMismatch) {
        input.setCustomValidity('Please enter a valid value');
      } else {
        input.setCustomValidity('');
      }
    });

    // Validate all required fields
    const errors: {[key: string]: boolean} = {};
    if (!companyName.trim()) errors.companyName = true;
    if (!state) errors.state = true;
    if (!email.trim()) errors.email = true;
    if (!password) errors.password = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setFieldErrors({ password: true });
      return;
    }

    setLoading(true);

    try {
      await register(email, password, companyName, state);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Leaf className="text-primary-600" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Carbon Tracker</h1>
          <p className="text-gray-600 mt-2">Start tracking your carbon footprint</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Create Account</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    e.target.setCustomValidity('');
                  }}
                  className={`input-field pl-10 ${fieldErrors.companyName ? 'border-red-500 border-2' : ''}`}
                  placeholder="Your Company Inc."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  e.target.setCustomValidity('');
                }}
                className={`input-field ${fieldErrors.state ? 'border-red-500 border-2' : ''}`}
                required
              >
                <option value="">Select your state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Provides regional emission factors (20-60% more accurate)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    e.target.setCustomValidity('');
                  }}
                  className={`input-field pl-10 ${fieldErrors.email ? 'border-red-500 border-2' : ''}`}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    e.target.setCustomValidity('');
                  }}
                  className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 border-2' : ''}`}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

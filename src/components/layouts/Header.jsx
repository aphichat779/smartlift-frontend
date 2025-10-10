import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users } from 'lucide-react';

const Header = ({ hiddenOnScroll = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getProfileImageSrc = (imgUrl) => {
    if (imgUrl) {
      return `${import.meta.env.VITE_REACT_APP_API_URL}${imgUrl}`;
    }
    return 'https://via.placeholder.com/150';
  };

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-50 md:hidden",
        "flex items-center justify-between p-4 bg-white shadow-md rounded-b-xl",
        "transition-transform duration-300 will-change-transform",
        hiddenOnScroll ? "-translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"
        >
          <span className="text-white font-bold text-sm">S</span>
        </button>
        <span className="font-semibold text-lg text-gray-900">SmartLift</span>
      </div>

      <div className="flex items-center gap-2">
        {user?.first_name && (
          <span className="text-sm font-medium text-gray-700">
            {user.first_name} {user.last_name}
          </span>
        )}
        {user?.user_img ? (
          <img
            src={getProfileImageSrc(user.user_img)}
            alt="User Profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-500" />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Smart navigate hook that prevents duplicate navigation to the same route
 * Useful for preventing history stack pollution when clicking profile links on profile pages
 */
export const useSmartNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const smartNavigate = (path, options = {}) => {
    // Eğer gidilecek path mevcut path ile aynıysa, navigate etme
    if (location.pathname === path) {
      return;
    }
    navigate(path, options);
  };

  return smartNavigate;
};

/**
 * Profile navigation helper
 * Returns a function that navigates to a user profile only if not already on that profile
 */
export const useProfileNavigate = () => {
  const smartNavigate = useSmartNavigate();

  const navigateToProfile = (username) => {
    smartNavigate(`/kullanici/${username}`);
  };

  return navigateToProfile;
};

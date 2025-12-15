import { useOutletContext } from 'react-router-dom';
import ProfilePage from '../components/ProfilePage';

/**
 * SettingsPage - Wrapper for ProfilePage component with route-based rendering
 */
export default function SettingsPage() {
  const { setIsMobileMenuOpen } = useOutletContext();

  return <ProfilePage onMenuClick={setIsMobileMenuOpen} />;
}

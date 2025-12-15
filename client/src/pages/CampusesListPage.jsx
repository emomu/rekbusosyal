import { useLoaderData, useNavigate, useOutletContext } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import { GridShimmer } from '../components/LoadingShimmer';

/**
 * CampusesListPage - Displays list of all campuses with ratings
 */
export default function CampusesListPage() {
  const navigate = useNavigate();
  const campuses = useLoaderData();
  const { setIsMobileMenuOpen, setShowNotifications, unreadCount } = useOutletContext();

  return (
    <div className="relative overflow-y-auto h-full">
      <MobileHeader
        onMenuClick={setIsMobileMenuOpen}
        onNotificationsClick={setShowNotifications}
        unreadCount={unreadCount}
      />

      <header className="hidden md:block sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
        Kampüsler
      </header>

      <div className="p-6 grid gap-5">
        {campuses.map((campus) => {
          const totalVotes = (campus.votes?.positive || 0) + (campus.votes?.neutral || 0) + (campus.votes?.negative || 0);
          const positivePercent = totalVotes > 0 ? Math.round(((campus.votes?.positive || 0) / totalVotes) * 100) : 0;
          const neutralPercent = totalVotes > 0 ? Math.round(((campus.votes?.neutral || 0) / totalVotes) * 100) : 0;
          const negativePercent = totalVotes > 0 ? Math.round(((campus.votes?.negative || 0) / totalVotes) * 100) : 0;

          return (
            <div
              key={campus._id}
              onClick={() => navigate(`/kampus/${campus._id}`)}
              className="relative overflow-hidden border border-gray-200 p-6 rounded-2xl cursor-pointer bg-white hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{campus.name}</h3>
                  <p className="text-sm text-gray-500">{totalVotes} değerlendirme</p>
                </div>
                <MapPin className="text-blue-600" size={28} />
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                  <span>👎 {negativePercent}%</span>
                  <span>😐 {neutralPercent}%</span>
                  <span>👍 {positivePercent}%</span>
                </div>
                <div className="flex bg-gray-200 rounded-full h-3 overflow-hidden">
                  {negativePercent > 0 && (
                    <div className="bg-red-500" style={{ width: `${negativePercent}%` }}></div>
                  )}
                  {neutralPercent > 0 && (
                    <div className="bg-blue-700" style={{ width: `${neutralPercent}%` }}></div>
                  )}
                  {positivePercent > 0 && (
                    <div className="bg-green-500" style={{ width: `${positivePercent}%` }}></div>
                  )}
                </div>
              </div>

              <div className="text-sm font-medium text-blue-600">Detayları gör →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

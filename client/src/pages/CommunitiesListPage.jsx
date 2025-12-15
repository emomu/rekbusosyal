import { useLoaderData, useNavigate, useOutletContext } from 'react-router-dom';
import { User } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';

/**
 * CommunitiesListPage - Displays list of all communities with ratings
 */
export default function CommunitiesListPage() {
  const navigate = useNavigate();
  const communities = useLoaderData();
  const { setIsMobileMenuOpen, setShowNotifications, unreadCount } = useOutletContext();

  return (
    <div className="relative overflow-y-auto h-full">
      <MobileHeader
        onMenuClick={setIsMobileMenuOpen}
        onNotificationsClick={setShowNotifications}
        unreadCount={unreadCount}
      />

      <header className="hidden md:block sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 p-4 font-bold text-lg">
        Topluluklar
      </header>

      <div className="p-6 grid gap-5">
        {communities.length > 0 ? (
          communities.map((community) => {
            const totalVotes =
              (community.votes?.positive || 0) +
              (community.votes?.neutral || 0) +
              (community.votes?.negative || 0);
            const positivePercent =
              totalVotes > 0 ? Math.round(((community.votes?.positive || 0) / totalVotes) * 100) : 0;
            const neutralPercent =
              totalVotes > 0 ? Math.round(((community.votes?.neutral || 0) / totalVotes) * 100) : 0;
            const negativePercent =
              totalVotes > 0 ? Math.round(((community.votes?.negative || 0) / totalVotes) * 100) : 0;

            return (
              <div
                key={community._id}
                onClick={() => navigate(`/topluluk/${community._id}`)}
                className="relative overflow-hidden border border-gray-200 p-6 rounded-2xl cursor-pointer bg-white hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{community.name}</h3>
                    <p className="text-sm text-gray-500">{totalVotes} değerlendirme</p>
                  </div>
                  <User className="text-blue-600" size={28} />
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
          })
        ) : (
          <div className="text-center text-gray-400 py-12">Henüz topluluk yok.</div>
        )}
      </div>
    </div>
  );
}

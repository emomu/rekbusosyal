import { getBadgeInfo, sortBadges } from '../utils/badgeUtils';

/**
 * Kullanıcı rozetlerini gösteren komponent
 * @param {Array} badges - Kullanıcının badge array'i
 * @param {string} size - Badge boyutu: 'sm', 'md', 'lg'
 * @param {boolean} showTooltip - Tooltip gösterilsin mi?
 */
export default function UserBadges({ badges = [], size = 'sm', showTooltip = true }) {
  if (!badges || badges.length === 0) return null;

  const sortedBadges = sortBadges([...badges]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="inline-flex items-center gap-1">
      {sortedBadges.map((badgeId) => {
        const badgeInfo = getBadgeInfo(badgeId);
        if (!badgeInfo) return null;

        return (
          <div
            key={badgeId}
            className={`relative group ${sizeClasses[size]}`}
            title={showTooltip ? `${badgeInfo.name} - ${badgeInfo.description}` : ''}
          >
            <img
              src={badgeInfo.image}
              alt={badgeInfo.name}
              className={`${sizeClasses[size]} object-contain`}
              onError={(e) => {
                // Resim yüklenemezse fallback icon göster
                e.target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = `${sizeClasses[size]} rounded-full bg-gradient-to-r ${badgeInfo.color}`;
                e.target.parentElement.appendChild(fallback);
              }}
            />
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {badgeInfo.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

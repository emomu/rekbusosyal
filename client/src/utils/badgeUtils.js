/**
 * Badge yönetimi ve gösterimi için utility fonksiyonları
 */

// Badge bilgileri
export const BADGE_INFO = {
  founder: {
    id: 'founder',
    name: 'Kurucu',
    description: 'Platform kurucusu',
    image: '/badges/founder.png',
    color: 'from-purple-500 to-pink-500'
  },
  bug_hunter: {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    description: 'Hata avcısı',
    image: '/badges/bug_hunter.png',
    color: 'from-green-500 to-emerald-500'
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Yönetici',
    image: '/badges/admin.png',
    color: 'from-red-500 to-orange-500'
  },
  moderator: {
    id: 'moderator',
    name: 'Moderatör',
    description: 'İçerik moderatörü',
    image: '/badges/moderator.png',
    color: 'from-blue-500 to-cyan-500'
  },
  supporter: {
    id: 'supporter',
    name: 'Destekçi',
    description: 'Platform destekçisi',
    image: '/badges/supporter.png',
    color: 'from-yellow-500 to-amber-500'
  },
  verified: {
    id: 'verified',
    name: 'Mavi Tik',
    description: 'Doğrulanmış hesap',
    image: '/badges/verified.png',
    color: 'from-blue-400 to-blue-600'
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    description: 'Platform geliştiricisi',
    image: '/badges/developer.png',
    color: 'from-indigo-500 to-purple-500'
  }
};

// Tüm badge'leri listele
export const getAllBadges = () => {
  return Object.values(BADGE_INFO);
};

// Badge bilgisini al
export const getBadgeInfo = (badgeId) => {
  return BADGE_INFO[badgeId] || null;
};

// Badge sıralama (öncelik sırasına göre)
export const sortBadges = (badges) => {
  const order = ['founder', 'developer', 'admin', 'moderator', 'verified', 'supporter', 'bug_hunter'];
  return badges.sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

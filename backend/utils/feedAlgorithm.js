/**
 * Karmaşık Sıralama Algoritması
 * 1. Recency (Yenilik): Yeni gönderiler daha değerlidir.
 * 2. Popularity (Popülerlik): Like ve Yorum sayısı skoru artırır.
 * 3. Personalization (Kişiselleştirme): Kullanıcının sevdiği kategorideki gönderiler boost alır.
 */

const calculateScore = (post, userInterests) => {
  const now = new Date();
  const postDate = new Date(post.createdAt);
  
  // 1. Zaman Aşımı (Decay): Her saat başı skor %5 azalır (Gravity)
  const hoursSincePost = (now - postDate) / (1000 * 60 * 60);
  const gravity = 1.8;
  
  // 2. Etkileşim Skoru
  const interactionScore = (post.likes.length * 2) + (post.viewCount * 0.1);
  
  // 3. Kişiselleştirme Çarpanı (Kullanıcı bu kategoriyi seviyor mu?)
  let interestMultiplier = 1;
  if (userInterests && userInterests.includes(post.category)) {
    interestMultiplier = 1.5; // %50 Boost
  }

  // Final Formül
  return (interactionScore / Math.pow(hoursSincePost + 2, gravity)) * interestMultiplier;
};

module.exports = { calculateScore };
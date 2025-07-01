const adjectives = [
  '배움에진심인', '열정적인', '호기심많은', '성실한', '도전하는',
  '지식가득한', '성장하는', '미래를여는', '지혜로운', '책읽는',
  '새벽을여는', '기록하는', '몰입하는', '끈기있는', '창의적인',
  '계획적인', '집중력높은', '노력하는', '꾸준한', '꼼꼼한'
];

const animals = [
  '부엉이', '다람쥐', '펭귄', '고슴도치', '고양이',
  '토끼', '여우', '사자', '돌고래', '나무늘보',
  '참새', '기린', '판다', '햄스터', '하마',
  '늑대', '두더지', '물개', '너구리', '호랑이'
];

function generateRandomNickname() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective} ${animal}`;
}
module.exports = generateRandomNickname;
const profileImages = [
  '/icons/loginprofil1.svg',
  '/icons/loginprofil2.svg',
  '/icons/loginprofil3.svg',
];

function getRandomProfileImage() {
  const index = Math.floor(Math.random() * profileImages.length);
  return profileImages[index];
}

module.exports = getRandomProfileImage;

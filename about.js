document.addEventListener('DOMContentLoaded', function () {
  const backBtn = document.getElementById('back-btn');

  backBtn.addEventListener('click', function () {
    window.location.href = 'popup.html';
  });
});

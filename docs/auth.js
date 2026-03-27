;(function () {
  if (sessionStorage.getItem('auth') !== 'ok') {
    const next = encodeURIComponent(location.pathname.split('/').pop() || '')
    location.replace('login.html' + (next ? '?next=' + next : ''))
  }
})()

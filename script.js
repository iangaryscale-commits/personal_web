/* ============================================================
   马俊羿 · 个人主页 —— 交互脚本
   1) 滚动时给吸顶导航加一层浅阴影
   2) 滚动到哪个区块，导航对应链接高亮
   （平滑滚动由 CSS 的 scroll-behavior 负责，这里不重复实现）
   ============================================================ */

(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  // 页内所有锚点链接：导航、左上角名字、首屏两个按钮
  var anchorLinks = Array.prototype.slice.call(
    document.querySelectorAll('a[href^="#"]')
  );

  // 按导航链接的顺序取出对应区块，顺便过滤掉页面上不存在的锚点
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    })
    .filter(Boolean);

  var current = null;

  function setActive(id) {
    if (id === current) return;
    current = id;
    navLinks.forEach(function (link) {
      var on = id !== null && link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', on);
      if (on) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // 视口被压成一条位于 50% 高度处的横线（见文件末尾的 rootMargin）：
  // 哪个区块跨过这条线，哪个就是当前区块。
  // 首屏（封面）不算区块，此时不高亮任何链接。
  var onscreen = Object.create(null);

  function syncActiveToScroll() {
    if (spyLocked) return; // 刚点过锚点，先按点击的来
    for (var i = 0; i < sections.length; i++) {
      if (onscreen[sections[i].id]) {
        setActive(sections[i].id);
        return;
      }
    }
    setActive(null);
  }

  /* 手动点了锚点就听点击的：跳转动画期间不让滚动监听改写高亮。
     页面快到底时几个区块挤在一屏里（点「技能」时「联系我」也在视野里），
     只按滚动位置判断会指错，所以点完之后先锁一会儿。
     锁的是「刚点的那一下」，不是「之后的所有滚动」——
     用户一旦自己动手（滚轮 / 触摸 / 按键 / 拖滚动条），立刻交还控制权，
     否则整个手势都会被吞掉，高亮会一直停在刚才点的那个区块上。 */
  var spyLocked = false;
  var lockTimer = null;

  function unlockSpy() {
    spyLocked = false;
    if (lockTimer) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }
  }

  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (type) {
    window.addEventListener(type, unlockSpy, { passive: true });
  });

  /* 窄屏导航是横向可滑的，点到的项可能在可视区外，顺手把它带进视野。
     block:'nearest' 保证只横向挪导航，不动页面的纵向位置 */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (link.scrollIntoView) {
        link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  });

  anchorLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      var id = link.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      setActive(id);
      spyLocked = true;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(unlockSpy, 600); // 兜底：一次滚动事件都没触发也能解锁
    });
  });

  // ---- 1) 导航栏滚动状态 ----
  var ticking = false;

  function onScroll() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    if (spyLocked) {
      clearTimeout(lockTimer);
      lockTimer = setTimeout(unlockSpy, 160); // 滚动停下来就解锁
    }
    ticking = false;
  }

  function requestScrollCheck() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }

  window.addEventListener('scroll', requestScrollCheck, { passive: true });
  onScroll();

  // ---- 2) 哪个区块在视野中间，就高亮哪个导航链接 ----
  if (!('IntersectionObserver' in window) || !sections.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        onscreen[entry.target.id] = entry.isIntersecting;
      });
      syncActiveToScroll();
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();

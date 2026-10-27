/* 커밋 히트맵을 3D '빌딩 숲'으로(Three.js, index.html의 importmap). 칸 하나가 건물 하나, 높이는 커밋 수.
   window.SKY.step(장, 단계, 자료): 0단계는 2D 히트맵, 1단계에서 위에서 내려다본 상태로 나타나 건물이 솟고 카메라가 옆으로 내려온다.
   자료: { rows: [줄 이름], cols: [칸 이름], cells: [[값 또는 null]], level: 값→0~4, tip: (r, c, v)→글 } */
(function () {
  var COLORS = ['#dedbea', '#c6beff', '#9a8cff', '#6e5cff', '#4733d6'];
  var THREE = null, Orbit = null, loading = null;   // 모듈 객체는 바꿀 수 없어 OrbitControls는 따로 둔다
  function three() {
    if (THREE) return Promise.resolve(THREE);
    if (!loading) loading = Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')])
      .then(function (m) { THREE = m[0]; Orbit = m[1].OrbitControls; return THREE; });
    return loading;
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function label(T, text, size, color) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), fs = 64;
    x.font = '700 ' + fs + 'px "Pretendard Variable", Pretendard, sans-serif';
    var w = Math.ceil(x.measureText(text).width) + 16; c.width = w; c.height = fs + 20;
    x.font = '700 ' + fs + 'px "Pretendard Variable", Pretendard, sans-serif'; x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(text, 8, c.height / 2);
    var tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    var s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
    s.scale.set(size * w / c.height, size, 1); return s;
  }

  function build(box, data) {
    var T = THREE, R = data.rows.length, C = data.cols.length;
    var W = box.clientWidth, H = box.clientHeight;
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W, H);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    box.appendChild(renderer.domElement);
    var scene = new T.Scene();
    var cx = (C - 1) / 2, cz = (R - 1) / 2;
    var camera = new T.PerspectiveCamera(32, W / H, .1, 400);

    scene.add(new T.HemisphereLight(0xffffff, 0xcfcbe8, 1.15));
    var sun = new T.DirectionalLight(0xffffff, 1.6);
    sun.position.set(cx - C * .45, 30, cz + R * 1.6); sun.target.position.set(cx, 0, cz);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera; sc.left = -C; sc.right = C; sc.top = C; sc.bottom = -C; sc.far = 120;
    scene.add(sun, sun.target);

    var ground = new T.Mesh(new T.PlaneGeometry(C + 3, R + 3), new T.MeshStandardMaterial({ color: 0xf3f2f8, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -.01, cz); ground.receiveShadow = true; scene.add(ground);

    // 건물: 칸마다 하나(InstancedMesh). 높이는 가장 큰 값을 maxH로
    var cells = [], max = 1;
    data.cells.forEach(function (row, r) { row.forEach(function (v, c) { if (v !== null && v !== undefined) { cells.push([r, c, v]); if (v > max) max = v; } }); });
    var maxH = data.maxH || Math.max(4, C * .2);
    var geo = new T.BoxGeometry(.82, 1, .82); geo.translate(0, .5, 0);
    var mat = new T.MeshStandardMaterial({ roughness: .55, metalness: .05 });
    var inst = new T.InstancedMesh(geo, mat, cells.length); inst.castShadow = true; inst.receiveShadow = true;
    var col = new T.Color(), m = new T.Matrix4(), heights = [];
    cells.forEach(function (k, i) {
      var h = k[2] > 0 ? .18 + Math.sqrt(k[2] / max) * maxH : .05;      // 제곱근: 낮은 건물도 눈에 띄게
      heights.push(h);
      col.set(COLORS[data.level(k[2])]); inst.setColorAt(i, col);
      m.makeScale(1, .001, 1); m.setPosition(k[1], 0, k[0]); inst.setMatrixAt(i, m);
    });
    scene.add(inst);

    // 줄·칸 이름(앞쪽과 왼쪽)
    data.rows.forEach(function (t, r) { var s = label(T, t, .62, '#6b6880'); s.position.set(-1.6, .3, r); scene.add(s); });
    data.cols.forEach(function (t, c) { if (!t) return; var s = label(T, t, .5, '#9a97ad'); s.position.set(c, .3, R + .4); scene.add(s); });

    var controls = new Orbit(camera, renderer.domElement);
    controls.target.set(cx, 0, cz); controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 8; controls.maxDistance = C * 2.6; controls.maxPolarAngle = Math.PI * .47; controls.enabled = false;

    var top = new T.Vector3(cx, C * 1.55, cz + .01), side = new T.Vector3(cx + C * .14, maxH * 1.25 + C * .38, cz + R * .9 + C * .62);   // 옆에서 조금 위: 빌딩 숲이면서 줄 사이 깊이도 보이게
    camera.position.copy(top); camera.lookAt(cx, 0, cz);

    var tip = document.createElement('div'); tip.className = 'sky-tip'; box.appendChild(tip);
    var ray = new T.Raycaster(), ptr = new T.Vector2(), hovered = -1;
    renderer.domElement.addEventListener('pointermove', function (e) {
      var b = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - b.left) / b.width) * 2 - 1; ptr.y = -((e.clientY - b.top) / b.height) * 2 + 1;
      ray.setFromCamera(ptr, camera); var hit = ray.intersectObject(inst)[0];
      hovered = hit ? hit.instanceId : -1;
      if (hovered < 0) { tip.style.opacity = 0; return; }
      var k = cells[hovered]; tip.textContent = data.tip(k[0], k[1], k[2]);
      tip.style.left = ((e.clientX - b.left) / b.width * 100) + '%'; tip.style.top = ((e.clientY - b.top) / b.height * 100) + '%'; tip.style.opacity = 1;
    });
    renderer.domElement.addEventListener('pointerleave', function () { tip.style.opacity = 0; });

    var st = { t0: 0, running: false, raf: 0 };
    function frame(now) {
      if (!st.running) return;
      if (!box.closest('.slide').classList.contains('cur')) { st.running = false; return; }   // 장을 떠나면 그리기를 멈춘다
      var t = (now - st.t0) / 1000;
      // 건물이 왼쪽 앞부터 차례로 솟는다
      if (t < 3.2) {
        cells.forEach(function (k, i) {
          var p = Math.min(1, Math.max(0, (t - .25 - (k[1] / C) * .9 - (k[0] / R) * .35) / .9));
          var y = Math.max(.001, heights[i] * (1 - Math.pow(1 - p, 3)));
          m.makeScale(1, y, 1); m.setPosition(k[1], 0, k[0]); inst.setMatrixAt(i, m);
        });
        inst.instanceMatrix.needsUpdate = true;
      }
      // 카메라: 위에서 내려다보다가 옆으로 내려온다
      if (t < 2.9) {
        var q = ease(Math.min(1, Math.max(0, (t - .35) / 2.5)));
        camera.position.lerpVectors(top, side, q); camera.lookAt(cx, maxH * .18 * q, cz);
        controls.target.set(cx, maxH * .18 * q, cz);
      } else if (!controls.enabled) { controls.enabled = true; controls.autoRotate = true; controls.autoRotateSpeed = .45; }
      if (controls.enabled) controls.update();
      renderer.render(scene, camera);
      st.raf = requestAnimationFrame(frame);
    }
    controls.addEventListener('start', function () { controls.autoRotate = false; });
    return {
      play: function () {
        cancelAnimationFrame(st.raf); controls.enabled = false; controls.autoRotate = false;
        camera.position.copy(top); camera.lookAt(cx, 0, cz);
        st.t0 = performance.now(); st.running = true; st.raf = requestAnimationFrame(frame);
      },
      stop: function () { st.running = false; cancelAnimationFrame(st.raf); }
    };
  }

  window.SKY = {
    step: function (el, step, data) {
      var box = el.querySelector('.sky'); if (!box) return;
      if (step < 1) { el.classList.remove('sky-on'); if (box._sky) box._sky.stop(); return; }
      el.classList.add('sky-on');
      three().then(function () {
        if (!box._sky) box._sky = build(box, data);
        if (el.classList.contains('cur')) box._sky.play();
      }).catch(function (e) { box.textContent = '3D를 불러오지 못했습니다'; console.error(e); });
    },
    stopAll: function () { document.querySelectorAll('.sky').forEach(function (b) { if (b._sky) b._sky.stop(); }); }
  };
})();

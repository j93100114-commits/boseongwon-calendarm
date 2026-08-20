/* =========================================================================== */
/* ================== [START: 서비스워커 — 홈 화면 앱용] ================== */
/* ===========================================================================
 *  이것이 있어야 폰에서 '앱 설치'가 뜹니다. 하는 일은 두 가지뿐입니다.
 *    ① 화면 파일을 담아 두어 인터넷이 없어도 앱이 열리게 한다
 *    ② 파이어베이스 통신은 **절대 건드리지 않는다** (담아 두면 낡은 재고가 보인다)
 *
 *  ⚠️ 담아 두는 방식은 '먼저 인터넷, 안 되면 담아 둔 것'(network-first) 입니다.
 *     반대로 하면 코드를 고쳐도 폰에 옛 화면이 계속 남습니다.
 *     그래서 이 앱은 파일 이름에 ?v=… 를 붙이는 작업이 필요 없습니다.
 * =========================================================================== */

const CACHE = 'jaego-v1';

// 인터넷이 없을 때를 위해 미리 담아 두는 것
const SHELL = [
    './',
    './index.html',
    './config.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', function(e){
    // 새 서비스워커를 곧바로 쓰게 한다 (안 그러면 탭을 다 닫아야 반영된다)
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then(function(c){
            // 하나라도 실패하면 설치가 통째로 실패하므로 개별로 담는다
            return Promise.all(SHELL.map(function(u){
                return c.add(u).catch(function(err){
                    console.warn('[sw] 담지 못함:', u, err);
                });
            }));
        })
    );
});

self.addEventListener('activate', function(e){
    e.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(keys.map(function(k){
                return k === CACHE ? null : caches.delete(k);   // 옛 판 정리
            }));
        }).then(function(){ return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(e){
    const req = e.request;

    // GET 이 아니면(저장·삭제 등) 손대지 않는다
    if(req.method !== 'GET') return;

    // ⚠️ 우리 주소가 아닌 것은 통째로 지나보낸다.
    //    파이어스토어(firestore.googleapis.com)와 SDK(gstatic.com)가 여기 해당한다.
    //    이걸 담아 두면 폰에 낡은 재고가 굳어 버린다 — 이 조건을 지우지 말 것.
    if(new URL(req.url).origin !== self.location.origin) return;

    // 먼저 인터넷, 실패하면 담아 둔 것
    e.respondWith(
        fetch(req).then(function(res){
            if(res && res.status === 200 && res.type === 'basic'){
                const copy = res.clone();
                caches.open(CACHE).then(function(c){ c.put(req, copy); });
            }
            return res;
        }).catch(function(){
            return caches.match(req).then(function(hit){
                if(hit) return hit;
                // 주소를 직접 친 경우엔 첫 화면이라도 내어 준다
                if(req.mode === 'navigate') return caches.match('./index.html');
                return new Response('오프라인입니다', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            });
        })
    );
});
/* ================== [END: 서비스워커] ================== */

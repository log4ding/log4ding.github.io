export function initialTraffic(){return {tick:0,failedAt:null,total:0,success:0,failures:0,retries:0,pending:[]};}
export function advanceTraffic(state,retry=false){
 const s={...state,pending:[...state.pending],tick:state.tick+1};
 const detected=s.failedAt!==null&&s.tick-s.failedAt>2,isRetry=retry&&detected&&s.pending.length>0;
 const id=isRetry?s.pending.shift():++s.total;if(isRetry)s.retries++;
 const target=detected?'B':s.tick%2?'A':'B',failed=target==='A'&&s.failedAt!==null;
 if(failed){s.failures++;s.pending.push(id);}else s.success++;
 return {state:s,event:{id,target,failed,isRetry,detected}};
}
// Deterministic illustration, not the actual proxy scheduling algorithm.
export function localityStep(tick){const before=['B','A','B','A'][tick%4];return {before,after:'A',cross:before==='B'};}
const box=(x,y,w,title,sub)=>`<rect x="${x}" y="${y}" width="${w}" height="52" rx="10"/><text x="${x+w/2}" y="${y+22}" text-anchor="middle">${title}</text><text class="svg-sub" x="${x+w/2}" y="${y+41}" text-anchor="middle">${sub}</text>`;
const wire=(d,c)=>`<path class="wire" style="stroke:${c}" d="${d}"/>`;
const dot=id=>`<circle data-dot="${id}" r="8" cx="0" cy="0"/>`;
export function trafficMarkup(mode){
 if(mode==='layers')return `<section class="routing-layers"><div class="routing-global"><strong>① 어느 Region으로 보낼까?</strong><p>글로벌 LB / DNS 정책 → Region A 또는 B 선택</p></div><div class="routing-regions">${['A','B'].map(r=>`<div><h3>Region ${r} · 독립 클러스터</h3><p>Ingress ${r} → FE Pod</p><strong>② 어느 API Pod로 보낼까?</strong><p>FE Pod → API Service<br><code>trafficDistribution: PreferSameZone</code></p><div class="routing-zones"><span>Zone 1<br>API Pod</span><span>Zone 2<br>API Pod</span></div></div>`).join('')}</div><p>①은 Region 선택 · ②는 선택된 Region 안의 Service 대상 선택. 함께 적용할 수 있습니다.</p></section>`;
 const r=mode==='region';return `<section class="traffic-demo" data-traffic="${mode}" aria-label="${r?'독립 클러스터 두 개의 장애 전환':'정상 상태의 위치 선호 전후 비교'}"><div class="diagram-heading">${r?'두 Region · 독립 클러스터 2개 · Service 2개':'한 Region · 클러스터 1개 · API Service 1개'}</div><div class="traffic-controls"><button data-action="play">재생</button><button data-action="step">${r?'한 요청씩':'동일 요청 비교'}</button>${r?'<button data-action="fail">Region A 전체 장애</button>':''}<button data-action="reset">초기화</button>${r?'<label><input type="checkbox" data-retry> 안전한 GET 재시도</label>':''}</div><div class="traffic-canvas"></div><p class="traffic-phase" aria-live="polite"></p><div class="traffic-counts"></div><p class="traffic-caption">${r?'보라: 글로벌 진입점의 Region 선택 · 주황: 실패 · 파랑: B 처리. 시간·비율은 설명용이며 기존 연결은 자동 이동하지 않습니다.':'모든 Pod가 정상입니다. 초록: 같은 Zone · 주황: 교차 Zone. 좌우는 같은 배치의 설정 전후이며 클러스터 2개가 아닙니다. 표본은 설명용이며 실제 비율·지연·비용 측정값이 아닙니다.'}</p></section>`;
}
function localitySVG(){
 const panel=(x,p)=>`<g transform="translate(${x},0)"><text x="195" y="28" text-anchor="middle">${p?'설정 후 · PreferSameZone':'설정 전 · 위치 선호 없음'}</text><rect class="cluster-boundary" x="5" y="43" width="385" height="330" rx="15"/><rect class="zone-boundary" x="18" y="160" width="192" height="198" rx="10"/><rect class="zone-boundary" x="224" y="160" width="151" height="198" rx="10"/><text x="30" y="186">Zone A</text><text x="240" y="186">Zone B</text>${wire('M112 211 V125 H300 V312',p?'#c7d1cb':'#c56116')}${wire('M112 211 V125 M112 151 V312','#16876b')}${box(29,201,165,'FE Pod · 호출자','Zone A에서 API 호출')}${box(32,78,322,'api Service · 동일한 VIP','대상: API Pod A + API Pod B')}${box(34,286,165,'API Pod A','정상 · 같은 Zone')}${box(236,286,128,'API Pod B','정상 · 다른 Zone')}<text class="svg-sub" x="195" y="398" text-anchor="middle">${p?'같은 Zone의 준비된 Pod를 선택':'가까운 Pod가 있어도 다른 Zone을 선택할 수 있음'}</text>${dot(p?'after':'before')}</g>`;
 return `<div class="locality-panels"><svg viewBox="0 0 400 418" role="img" aria-label="설정 전: 같은 Zone와 다른 Zone 모두 선택 후보">${panel(0,false)}</svg><svg viewBox="0 0 400 418" role="img" aria-label="설정 후: 같은 Zone의 정상 Pod 선호">${panel(0,true)}</svg></div>`;
}
function regionSVG(s){
 const cluster=(x,r)=>`<g class="${r==='A'&&s.failedAt!==null?'unhealthy':''}"><rect class="cluster-boundary" x="${x}" y="178" width="330" height="297" rx="16"/><text x="${x+165}" y="205" text-anchor="middle">Region ${r} · 독립 클러스터 ${r}</text>${wire(`M${x+165} 213 V420`,'#8061b1')}${box(x+65,218,200,'Ingress '+r,'지역별 진입점')}${box(x+65,293,200,'Service '+r,'클러스터 내부 VIP')}${box(x+65,368,200,'Pod '+r,'Deployment '+r+'가 관리')}<text class="svg-sub" x="${x+165}" y="452" text-anchor="middle">${r==='A'&&s.failedAt!==null?'지역 전체 사용 불가':'정상 · 서비스와 데이터 준비'}</text></g>`;
 return `<svg viewBox="0 0 820 490" role="img" aria-label="글로벌 LB 아래 독립된 두 Region의 Ingress, Service, Pod">${wire('M410 48 V105 M410 131 L185 218 M410 131 L635 218','#8061b1')}${box(320,0,180,'Browser','외부 사용자')}${box(255,79,310,'글로벌 LB · Region 선택','지역 상태 확인과 전환 정책')}${cluster(20,'A')}${cluster(470,'B')}${dot('request')}</svg>`;
}
export function mountTraffic(root){
 const cleanups=[];
 root.querySelectorAll('[data-traffic]').forEach(el=>{
  const region=el.dataset.traffic==='region';let s=initialTraffic(),tick=0,cross=0,timer=null,animations=[];
  const cancel=()=>{animations.forEach(a=>a.cancel());animations=[];};
  const move=(id,path,color,end,animate)=>{const d=el.querySelector(`[data-dot="${id}"]`);d.setAttribute('fill',color);if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.style.offsetPath=`path('${path}')`;animations.push(d.animate([{offsetDistance:'0%'},{offsetDistance:'100%'}],{duration:1050,fill:'forwards'}));}else{d.setAttribute('cx',end[0]);d.setAttribute('cy',end[1]);}};
  const draw=e=>{
   cancel();el.querySelector('.traffic-canvas').innerHTML=region?regionSVG(s):localitySVG();
   if(region){const x=e?.target==='B'?635:185;move('request',`M410 25 V105 L${x} 244 V${e?.failed?244:394}`,e?.failed?'#c56116':e?.target==='B'?'#287dd4':'#8061b1',e?[x,e.failed?244:394]:[410,25],!!e);
    el.querySelector('.traffic-phase').textContent=e?`요청 #${e.id}${e.isRetry?' 재시도':''} → Region ${e.target} · ${e.failed?'실패':'성공'} | ${s.failedAt===null?'두 클러스터 정상':e.detected?'글로벌 LB 반영 완료 → B 선택':'장애 감지 대기 · 이전 Region 선택이 남음'}`:'두 Region이 이미 동작 중입니다. 지역 전체 장애 후 글로벌 LB의 선택을 관찰하세요.';
    el.querySelector('.traffic-counts').textContent=`논리 요청 ${s.total} · 완료 ${s.success} · 미완료 ${s.pending.length} · 실패 시도 ${s.failures} · 재시도 ${s.retries}`;el.querySelector('[data-action="fail"]').disabled=s.failedAt!==null;
   }else{const t=e?.before==='B';move('before',t?'M112 226 V125 H300 V312':'M112 226 V125 V312',t?'#c56116':'#16876b',e?[t?300:112,312]:[112,226],!!e);move('after','M112 226 V125 V312','#16876b',e?[112,312]:[112,226],!!e);
    el.querySelector('.traffic-phase').textContent=e?`동일 호출 #${tick}: 설정 전 → Zone ${e.before}${t?' (경계 통과)':''} / 설정 후 → Zone A. 양쪽 모두 정상 응답.`:'장애를 발생시키지 않습니다. 동일 요청 비교를 눌러 정상 상태의 이동 차이를 보세요.';
    el.querySelector('.traffic-counts').textContent=`동일 호출 ${tick}쌍 · 설정 전 교차 Zone ${cross}회 · 설정 후 교차 Zone 0회 · 장애 0`;
   }
  };
  const step=()=>{if(region){const r=advanceTraffic(s,el.querySelector('[data-retry]').checked);s=r.state;draw(r.event);}else{const e=localityStep(tick++);if(e.cross)cross++;draw(e);}};
  const stop=()=>{clearInterval(timer);timer=null;el.querySelector('[data-action="play"]').textContent='재생';};
  el.querySelector('[data-action="play"]').onclick=()=>{if(timer){stop();return;}step();timer=setInterval(step,1600);el.querySelector('[data-action="play"]').textContent='일시 정지';};
  el.querySelector('[data-action="step"]').onclick=()=>{stop();step();};
  if(region)el.querySelector('[data-action="fail"]').onclick=()=>{s.failedAt=s.tick;draw();el.querySelector('.traffic-phase').textContent='Region A 전체 장애. 글로벌 LB 감지 전 2단계 동안 실패할 수 있습니다. Service 설정은 바뀌지 않았습니다.';};
  el.querySelector('[data-action="reset"]').onclick=()=>{stop();s=initialTraffic();tick=0;cross=0;draw();};draw();cleanups.push(()=>{stop();cancel();});
 });return ()=>cleanups.forEach(fn=>fn());
}

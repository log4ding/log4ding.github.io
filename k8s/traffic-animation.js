export function initialTraffic(mode) { return {mode, tick:0, failedAt:null, total:0, success:0, failures:0, retries:0, pending:[]}; }
export function advanceTraffic(state, retry=false) {
  const s={...state,pending:[...state.pending],tick:state.tick+1};
  const detected=s.failedAt!==null && s.tick-s.failedAt>2;
  const isRetry=retry && detected && s.pending.length>0;
  const id=isRetry?s.pending.shift():++s.total;
  if(isRetry)s.retries++;
  const target=detected?'B':s.mode==='zone'?'A':s.tick%2?'A':'B';
  const failed=target==='A' && s.failedAt!==null;
  if(failed){s.failures++;s.pending.push(id);}else s.success++;
  return {state:s,event:{id,target,failed,isRetry,detected}};
}
export function trafficMarkup(mode){return `<section class="traffic-demo" data-traffic="${mode}" aria-label="${mode==='zone'?'Zone 대상 선택':'두 Region 장애 전환'} 시뮬레이션"><div class="traffic-controls"><button data-action="play">재생</button><button data-action="step">한 요청씩</button><button data-action="fail">${mode==='zone'?'Zone A 대상':'Region A'} 장애</button><button data-action="reset">초기화</button><label><input type="checkbox" data-retry> 안전한 GET 재시도</label></div><div class="traffic-canvas"></div><p class="traffic-phase" aria-live="polite"></p><div class="traffic-counts"></div><p class="traffic-caption">초록: A 경로 · 파랑: B 경로 · 주황: 실패 시도. 시간·분산 비율은 설명용입니다. 기존 연결은 다른 Region으로 자동 이동하지 않습니다.</p></section>`;}
export function mountTraffic(root){
  const cleanups=[];
  root.querySelectorAll('[data-traffic]').forEach(el=>{
    const mode=el.dataset.traffic;let s=initialTraffic(mode),timer=null,animations=[];
    const region=mode==='region';
    const box=(x,y,w,title,sub)=>`<rect x="${x}" y="${y}" width="${w}" height="58" rx="12"/><text x="${x+w/2}" y="${y+23}" text-anchor="middle">${title}</text><text class="svg-sub" x="${x+w/2}" y="${y+43}" text-anchor="middle">${sub}</text>`;
    const draw=(event)=>{
      animations.forEach(a=>a.cancel());animations=[];
      el.querySelector('.traffic-canvas').innerHTML=`<svg viewBox="0 0 820 300" role="img" aria-label="${region?'브라우저에서 글로벌 라우터를 거쳐 두 Region의 Ingress, Service, Pod로 전달':'Zone A 호출자에서 Service를 통해 Zone A 또는 B Endpoint로 전달'}"><path class="wire" d="M150 145 H290"/><path class="wire" style="stroke:#16876b" d="M290 145 L390 75 H760"/><path class="wire" style="stroke:#287dd4" d="M290 145 L390 225 H760"/>${box(10,116,140,region?'Browser':'Zone A 호출자','요청 시작')}${box(190,116,180,region?'글로벌 라우팅':'Service',''+(region?'클러스터 바깥':'위치 선호'))}<g class="region-a ${s.failedAt!==null?'unhealthy':''}">${box(390,46,180,region?'Region A · Ingress':'Zone A Endpoint',region?'→ Service A':'가까운 대상')}${box(610,46,190,region?'Pod A':'Pod A',region?'Deployment A가 관리':'같은 클러스터')}</g><g class="region-b">${box(390,196,180,region?'Region B · Ingress':'Zone B Endpoint',region?'→ Service B':'대체 대상')}${box(610,196,190,region?'Pod B':'Pod B',region?'Deployment B가 관리':'같은 클러스터')}</g><circle class="request-dot" r="9" cx="${event?760:85}" cy="${event?(event.target==='A'?75:225):145}" fill="${event?.failed?'#c56116':event?.target==='B'?'#287dd4':'#16876b'}"/></svg>`;
      if(event && !matchMedia('(prefers-reduced-motion: reduce)').matches){const dot=el.querySelector('.request-dot');dot.style.offsetPath=`path('M85 145 H290 L390 ${event.target==='A'?75:225} H760')`;dot.setAttribute('cx','0');dot.setAttribute('cy','0');animations.push(dot.animate([{offsetDistance:'0%'},{offsetDistance:'100%'}],{duration:850,fill:'forwards'}));}
      el.querySelector('.traffic-phase').textContent=event?`요청 #${event.id}${event.isRetry?' 재시도':''} → ${event.target} · ${event.failed?'실패 (재시도 대기)': '성공'} | ${s.failedAt===null?'두 대상 정상':event.detected?'장애 감지·라우팅 반영 완료 → B 선택':'장애 감지·전파 대기 (설명용 2단계)'}`:'정상 상태에서 시작하세요. 장애 버튼 이후에도 감지 전 요청은 실패할 수 있습니다.';
      el.querySelector('.traffic-counts').textContent=`논리 요청 ${s.total} · 성공 ${s.success} · 미완료 ${s.pending.length} · 실패 시도 ${s.failures} · 재시도 ${s.retries}`;
      el.querySelector('[data-action="fail"]').disabled=s.failedAt!==null;
    };
    const step=()=>{const result=advanceTraffic(s,el.querySelector('[data-retry]').checked);s=result.state;draw(result.event);};
    const stop=()=>{clearInterval(timer);timer=null;el.querySelector('[data-action="play"]').textContent='재생';};
    el.querySelector('[data-action="play"]').onclick=()=>{if(timer){stop();return;}step();timer=setInterval(step,1400);el.querySelector('[data-action="play"]').textContent='일시 정지';};
    el.querySelector('[data-action="step"]').onclick=()=>{stop();step();};
    el.querySelector('[data-action="fail"]').onclick=()=>{s.failedAt=s.tick;draw();el.querySelector('.traffic-phase').textContent='A 장애 발생. 다음 두 단계는 아직 이전 경로가 남아 있는 감지 지연 구간입니다.';};
    el.querySelector('[data-action="reset"]').onclick=()=>{stop();s=initialTraffic(mode);draw();};
    draw();cleanups.push(()=>{stop();animations.forEach(a=>a.cancel());});
  });return ()=>cleanups.forEach(fn=>fn());
}

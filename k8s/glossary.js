import {tableMarkup} from './learning.js';
const groups=[
 ['요청과 주소',[
  ['트래픽','네트워크로 오가는 요청·응답 등의 데이터.','브라우저가 HTML을 받고 /api를 호출하는 통신'],
  ['IP · Port','IP는 통신 대상의 주소, Port는 그 대상에서 접속할 서비스의 번호.','localhost:8080의 8080이 Port'],
  ['localhost','지금 프로그램이 실행되는 자기 환경을 가리키는 이름.','내 브라우저에서는 내 컴퓨터, Pod 안에서는 해당 Pod의 네트워크 환경'],
  ['도메인 · DNS','도메인은 사람이 읽는 이름, DNS는 이름에 대한 주소 등의 정보를 조회하는 체계.','app.example.com을 조회해 진입점 주소 확인'],
  ['VIP · ClusterIP','VIP는 가상의 IP 주소. ClusterIP는 Service에 할당되는 클러스터 내부 가상 주소.','Pod 주소가 바뀌어도 같은 Service 주소로 접근'],
  ['HTTP · Host · Path','HTTP는 웹 요청·응답 규칙. Host는 대상 호스트, Path는 요청 경로.','https://app.example.com/api/users에서 Path는 /api/users'],
  ['Load Balancer (LB)','여러 대상 중 요청이나 연결을 전달할 대상을 선택하는 구성 요소.','정상인 여러 서버에 트래픽 분산']
 ]],
 ['앱을 실행하고 관리하기',[
  ['Kubernetes · K8s','컨테이너 앱을 원하는 상태로 배포·확장·관리하는 플랫폼.','앱을 3개 유지하도록 선언'],
  ['Container Image','실행에 필요한 앱과 환경을 담은 패키지.','fe-study:v1 이미지'],
  ['Container','이미지를 바탕으로 실행하는 격리된 프로세스 환경.','이미지로 시작한 Node.js 서버'],
  ['Cluster · Node','Cluster는 함께 관리하는 전체 환경, Node는 그 안의 실행용 컴퓨터.','내 노트북에 Node 1개의 학습용 Cluster 구성'],
  ['Pod','하나 이상의 컨테이너가 네트워크·저장 자원을 공유하는 실행 단위.','이 수업에서는 앱 컨테이너 하나를 담은 Pod'],
  ['Deployment · ReplicaSet','Deployment는 Pod 배포·업데이트를 관리하고, ReplicaSet은 지정된 수의 Pod를 유지.','Deployment → ReplicaSet → Pod라는 관리 관계'],
  ['replicas','원하는 Pod 복제본 개수.','replicas: 3은 Pod 3개 유지 요청'],
  ['Namespace','클러스터 안에서 리소스를 이름 공간으로 나누는 범위.','study와 advanced-study를 구분'],
  ['Label · Selector','Label은 리소스에 붙이는 표식, Selector는 그 표식으로 대상을 고르는 조건.','app: frontend인 Pod를 Service가 선택'],
  ['YAML · Manifest · kubectl','YAML은 자료 표현 형식, Manifest는 원하는 리소스를 적은 문서, kubectl은 클러스터에 명령하는 도구.','kubectl apply -f deployment.yaml']
 ]],
 ['요청을 앱에 연결하기',[
  ['Service','변하는 Pod들 앞에 이름과 접속 지점을 제공하고 대상 Endpoint를 연결하는 리소스.','frontend Service로 앱에 접속'],
  ['Endpoint · EndpointSlice','Endpoint는 실제 전달 대상 주소·포트, EndpointSlice는 대상과 준비 상태 등을 묶어 기록하는 리소스.','준비된 Pod IP:8080이 Service의 대상'],
  ['Ingress · Ingress Controller','Ingress는 HTTP(S) 라우팅 규칙, Controller는 그 규칙을 실제 프록시 설정 등에 반영하는 구현체.','/는 FE Service, /api는 API Service로 연결'],
  ['Gateway API · Gateway · HTTPRoute','Gateway API는 라우팅 API 모음. Gateway는 트래픽 입구를 선언하고 HTTPRoute는 HTTP 경로·목적지를 정의.','Gateway의 HTTP Listener에 HTTPRoute 연결'],
  ['GatewayClass','어떤 컨트롤러가 Gateway를 구현할지 정하는 클래스.','수업의 eg GatewayClass'],
  ['Region · Zone','Region은 지역 단위, Zone은 Region 안의 장애 격리 구역.','한 Region에 여러 Zone, Region마다 독립 클러스터를 둘 수도 있음'],
  ['trafficDistribution','Service의 Endpoint 선택에 위치 선호를 표현하는 설정.','PreferSameZone: 호출자와 같은 Zone의 대상을 선호'],
  ['weight','HTTPRoute 등에서 목적지별로 트래픽을 나눌 상대 가중치.','v1:v2 = 90:10. 위치 선호와 다른 설정']
 ]],
 ['배포와 운영 · 나중에 다시 보기',[
  ['Rollout · Rollback','Rollout은 새 설정·버전을 배포하는 과정, Rollback은 이전 상태로 되돌리는 작업.','새 이미지로 업데이트하고 문제 시 이전 리비전으로 복귀'],
  ['Readiness · Liveness · Startup Probe','각각 요청을 받을 준비, 재시작이 필요한 상태, 초기화 완료를 검사.','readiness 실패는 대상 제외, liveness 실패는 컨테이너 재시작 처리'],
  ['preStop · SIGTERM','preStop은 컨테이너 종료 전 Hook, SIGTERM은 프로세스에 종료를 요청하는 신호.','전파 대기 후 종료 신호를 받아 진행 중 요청 마무리'],
  ['Access Log · Header','접근 로그는 요청·응답 기록, Header는 HTTP 요청·응답의 부가 정보.','X-Study-Id를 로그에 기록해 요청 추적'],
  ['Argo CD · GitOps','Git의 선언된 상태를 기준으로 클러스터 상태를 맞추는 운영 방식과 이를 돕는 도구.','이 수업에서는 개념만 학습']
 ]]
];
export function glossaryMarkup(){return `<section class="glossary" aria-label="처음 보는 용어 사전"><h3>찾아보는 용어 사전</h3><p>처음부터 외우지 않아도 됩니다. 수업 중 낯선 단어가 나오면 왼쪽 ‘용어 정리’로 돌아오세요.</p>${groups.map(([title,rows])=>`<h3>${title}</h3>${tableMarkup({headers:['용어','쉬운 뜻','수업에서의 예'],rows})}`).join('')}<div class="callout">요청 경로: Ingress / Gateway → Service의 대상 Pod<br>관리 관계: Deployment → ReplicaSet → Pod<br>Deployment와 ReplicaSet은 요청이 통과하는 네트워크 장비가 아닙니다.</div></section>`;}

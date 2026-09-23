import {mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../k8s/',import.meta.url);
await mkdir(new URL('chapters/',root),{recursive:true});
await mkdir(new URL('labs/',root),{recursive:true});
const docs={overview:'https://kubernetes.io/docs/concepts/overview/',components:'https://kubernetes.io/docs/concepts/overview/components/',pods:'https://kubernetes.io/docs/concepts/workloads/pods/',deploy:'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',rs:'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/',svc:'https://kubernetes.io/docs/concepts/services-networking/service/',vip:'https://kubernetes.io/docs/reference/networking/virtual-ips/',dns:'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/',ingress:'https://kubernetes.io/docs/concepts/services-networking/ingress/',gateway:'https://gateway-api.sigs.k8s.io/docs/concepts/api-overview/',split:'https://gateway-api.sigs.k8s.io/guides/user-guides/traffic-splitting/',envoy:'https://gateway.envoyproxy.io/docs/tasks/quickstart/',config:'https://kubernetes.io/docs/concepts/configuration/configmap/',secret:'https://kubernetes.io/docs/concepts/configuration/secret/',probe:'https://kubernetes.io/docs/concepts/workloads/pods/probes/',debug:'https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/',mini:'https://minikube.sigs.k8s.io/docs/start/',docker:'https://docs.docker.com/get-started/docker-concepts/building-images/writing-a-dockerfile/',argo:'https://argo-cd.readthedocs.io/en/stable/getting_started/',rollouts:'https://argo-rollouts.readthedocs.io/en/stable/',blue:'https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/',canary:'https://argo-rollouts.readthedocs.io/en/stable/features/canary/'};
const sources=(...keys)=>keys.map(k=>[({overview:'Kubernetes 개요',components:'구성 요소',pods:'Pod',deploy:'Deployment',rs:'ReplicaSet',svc:'Service',vip:'Virtual IP',dns:'클러스터 DNS',ingress:'Ingress',gateway:'Gateway API',split:'트래픽 분할',envoy:'Envoy Gateway 설치',config:'ConfigMap',secret:'Secret',probe:'Probes',debug:'Pod 디버깅',mini:'minikube 설치',docker:'Dockerfile',argo:'Argo CD',rollouts:'Argo Rollouts',blue:'Blue-Green',canary:'Canary'})[k],docs[k]]);
const S=(title,lead,extra={})=>({title,lead,...extra});
const Q=(title,answer,notes=[])=>S(title,'먼저 자신의 말로 답하고, 해설을 열어 비교해 보세요.',{kind:'CHECK YOUR UNDERSTANDING',answer,notes});
const lab=async(name,text)=>{await writeFile(new URL('labs/'+name,root),text.trim()+'\n');return text.trim();};
const course=[];
const add=(id,short,title,description,keys,slides,type='개념 + 실습')=>course.push({id,short,title,description,type,sources:sources(...keys),slides});
const namespace=await lab('namespace.yaml',`apiVersion: v1
kind: Namespace
metadata:
  name: study`);
const server=await lab('server.mjs',`import http from 'node:http';
import os from 'node:os';
const version = process.env.APP_VERSION || 'v1';
const app = http.createServer((req, res) => {
  if (req.url === '/healthz') { res.end('ok'); return; }
  if (req.url.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({version, pod: os.hostname()})); return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><html lang="ko"><meta charset="utf-8"><title>K8s lab</title><body style="font:20px system-ui;padding:50px;background:#eef5e5"><h1>Hello Kubernetes · ' + version + '</h1><p>Pod: ' + os.hostname() + '</p><button id="load">API 호출</button><pre id="result"></pre><script>document.querySelector("#load").onclick=async()=>{try{const r=await fetch("/api");document.querySelector("#result").textContent=JSON.stringify(await r.json(),null,2);}catch(e){document.querySelector("#result").textContent=e.message;}};<\/script></body></html>');
});
app.listen(8080, '0.0.0.0');
process.on('SIGTERM', () => app.close(() => process.exit(0)));`);
const dockerfile=await lab('Dockerfile',`FROM node:22-alpine
WORKDIR /app
COPY server.mjs .
ENV APP_VERSION=v1
EXPOSE 8080
USER node
CMD ["node", "server.mjs"]`);
const pod=await lab('pod.yaml',`apiVersion: v1
kind: Pod
metadata:
  name: hello
  namespace: study
  labels:
    app: hello
spec:
  containers:
    - name: web
      image: fe-study:v1
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 8080`);
const deploy=await lab('deployment.yaml',`apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: study
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: web
          image: fe-study:v1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          env:
            - name: APP_VERSION
              value: v1`);
const service=await lab('service.yaml',`apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: study
spec:
  selector:
    app: frontend
  ports:
    - name: http
      port: 80
      targetPort: 8080
  type: ClusterIP`);
const config=await lab('configmap.yaml',`apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: study
data:
  APP_VERSION: local-study`);
const ingress=await lab('ingress-reference.yaml',`# 설명용: 이 파일만으로 Controller가 설치되지 않습니다.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend
  namespace: study
spec:
  ingressClassName: example-controller
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80`);
const gateway=await lab('gateway.yaml',`apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: eg
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: study-gateway
  namespace: study
spec:
  gatewayClassName: eg
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: Same`);
const route=await lab('route.yaml',`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: frontend
  namespace: study
spec:
  parentRefs:
    - name: study-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: frontend
          port: 80`);
const v2=await lab('v2.yaml',deploy.replaceAll('frontend','frontend-v2').replace('replicas: 3','replicas: 2').replace('value: v1','value: v2')+'\n---\n'+service.replaceAll('frontend','frontend-v2'));
const split=await lab('split.yaml',route.replace('          port: 80','          port: 80\n          weight: 90\n        - name: frontend-v2\n          port: 80\n          weight: 10'));
const probes=await lab('probes-patch.yaml',`spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: web
          startupProbe:
            httpGet:
              path: /healthz
              port: 8080
            periodSeconds: 2
            failureThreshold: 30
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            periodSeconds: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            periodSeconds: 10
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 128Mi`);
add('01','Kubernetes 첫걸음','화면 너머, Kubernetes','내 앱을 실행하고 유지하는 시스템을 만납니다.',['overview','components'],[
 S('앱을 만들었다. 그다음은?','브라우저에 보이는 화면 뒤에는, 항상 실행 중이어야 하는 프로그램이 있습니다.',{cards:[['개발','내 노트북에서 dev 서버를 켜고 수정합니다.'],['배포','실행할 파일과 이미지를 서비스 환경으로 전달합니다.'],['운영','앱이 죽으면 복구하고, 새 버전을 반영하며, 사용량에 맞게 늘립니다.']],notes:['예를 들어 쇼핑몰 FE를 빌드했다고 생각해 봅시다. dist 폴더 자체가 네트워크 요청을 받지는 않습니다. 웹 서버 프로세스가 HTML·JS·CSS를 응답해야 사용자가 화면을 볼 수 있습니다.','오늘은 25분 개념 → 20분 요청 추적 → 15분 토론 순서로 진행합니다. 설치는 다음 주에 합니다. 학습이 끝나면 “앱을 실행한다”와 “앱이 계속 실행되게 관리한다”의 차이를 설명해 보세요.']}),
 S('Kubernetes는 앱의 실행 상태를 관리합니다','컨테이너화된 앱의 배포·확장·관리를 자동화하는 오픈 소스 플랫폼입니다.',{flow:['원하는 상태 선언','현재 상태 관찰','차이를 줄이는 동작'],callout:'K8s는 Kubernetes의 K와 s 사이에 8글자가 있다는 줄임말입니다.',notes:['“앱을 3개 실행해 줘”라고 선언하면 컨트롤러가 실제 실행 상태를 확인하고 부족한 인스턴스를 보충합니다. 이 반복을 reconciliation이라고 부릅니다.','Kubernetes가 FE 코드를 컴파일하거나 애플리케이션 버그를 수정하지는 않습니다. 이미지를 만들고 애플리케이션이 정상 동작하도록 구현하는 일은 여전히 개발자의 책임입니다. 소규모 앱마다 Kubernetes가 반드시 필요한 것도 아닙니다.']}),
 S('Cluster · Node · Pod','큰 실행 환경 안에 컴퓨터가 있고, 그 위에서 앱이 실행됩니다.',{cards:[['Cluster','Kubernetes로 함께 관리하는 전체 환경.'],['Node','앱을 실행하는 실제 또는 가상 컴퓨터.'],['Pod','컨테이너를 함께 실행하는 Kubernetes의 기본 단위.']],flow:['Cluster','Node','Pod','Container'],notes:['컨트롤 플레인은 API 서버·스케줄러·컨트롤러 등을 통해 클러스터 상태를 관리합니다. 각 Node의 kubelet은 할당된 Pod의 컨테이너가 실행되도록 관리합니다. 지금은 이름을 외우기보다 역할을 구분하세요.','로컬에서는 한 대의 노트북 안에 이 환경을 만듭니다. 운영 환경이 여러 컴퓨터에 분산되어 있다고 해서 로컬 학습에도 여러 물리 컴퓨터가 필요한 것은 아닙니다.']}),
 S('주소를 읽는 순서: IP, 포트, HTTP','IP는 접속할 네트워크 주소, 포트는 그 주소에서 접근할 서비스의 입구입니다.',{cards:[['localhost','지금 접속을 시도하는 자기 환경을 가리키는 이름.'],[':8080','프로그램이 요청을 기다리는 포트.'],['/api','서버가 처리할 HTTP 요청 경로.']],code:'http://localhost:8080/api\n └HTTP  └호스트   └포트 └경로',notes:['브라우저가 localhost에 요청하면 사용자 컴퓨터를 향합니다. Pod 내부 코드가 localhost에 요청하면 그 Pod의 네트워크 환경을 향합니다. 같은 글자여도 요청을 보낸 위치가 중요합니다.','DNS는 도메인에 대응하는 주소 등을 알려줍니다. HTTP는 요청과 응답의 규칙이며, HTTPS는 TLS로 통신을 보호합니다. 5주차에서 도메인·VIP 관계를 더 살펴봅니다.']}),
 S('두 개의 화살표를 구분하세요','요청이 흐르는 관계와, 리소스를 관리하는 관계는 다릅니다.',{flow:['Deployment','ReplicaSet','Pod'],callout:'위 그림은 관리 관계입니다. HTTP 요청은 Deployment나 ReplicaSet을 경유하지 않습니다.',notes:['요청 흐름은 브라우저 → Gateway/Ingress 구현체 → Service가 가리키는 Pod로 이해합니다. 구현체에 따라 Service의 ClusterIP를 거치지 않고 Endpoint로 직접 보낼 수도 있습니다.','Deployment는 버전과 Pod 템플릿을 관리하고 ReplicaSet은 원하는 복제 개수를 유지합니다. Service는 실행 중인 Pod를 찾는 안정적인 접점을 제공합니다. 앞으로 각각을 직접 확인합니다.']}),
 S('함께 해보기: 요청의 출발점을 찾기','평소 접속하는 웹 페이지에서 개발자 도구의 Network 탭을 열어 보세요.',{kind:'DISCUSSION',bullets:['새로고침 후 HTML 문서 요청과 JS 파일 요청을 찾습니다.','Request URL에서 호스트·포트·경로를 구분합니다.','버튼을 눌러 생긴 API 요청의 Initiator를 확인합니다.'],notes:['실제 서비스 설정을 바꾸는 실습이 아닙니다. 개발자 도구에 보이는 요청을 읽기만 합니다. 개인정보·인증 헤더는 공유하지 말고 요청의 구조만 말해 보세요.','정적 FE 페이지는 브라우저에서 JS가 실행되어 API를 호출합니다. SSR 앱이라면 서버가 HTML을 만들면서 API를 호출할 수도 있습니다. “이 요청은 누가 보냈나?”를 항상 먼저 확인하세요.'],expected:'문서·정적 파일·API 요청을 구분하고 요청 주체를 설명할 수 있습니다.'}),
 Q('Pod 3개 중 하나가 사라지면 누가 보충할까요?','ReplicaSet 컨트롤러가 현재 Pod 수와 선언된 수의 차이를 보고 새 Pod를 만듭니다. Deployment는 그 ReplicaSet과 배포 버전을 관리합니다. Service는 Pod를 만드는 역할이 아닙니다.',['다음 주 준비: Docker를 설치할 수 있는지, 가상화가 허용되는지, 이미지 다운로드 네트워크가 열려 있는지 확인합니다.'])
]);
add('02','로컬 클러스터 설치','내 컴퓨터에 작은 클러스터','도구를 설치하고 첫 페이지가 뜨는 순간까지.',['mini'],[
 S('세 가지 도구, 서로 다른 역할','Docker가 실행 환경을 제공하고, minikube가 클러스터를 만들며, kubectl이 명령을 전달합니다.',{cards:[['Docker','이번 실습에서 minikube Node를 컨테이너로 실행할 기반.'],['minikube','로컬 클러스터의 생성·중지·재시작을 담당.'],['kubectl','Kubernetes API 서버에 요청하는 클라이언트.']],notes:['Docker Desktop의 내장 Kubernetes는 켜지 않아도 됩니다. 이번 수업에서는 minikube가 만든 클러스터 하나를 사용합니다.','최소 요구 사항은 공식 설치 페이지에서 확인하세요. 작은 실습을 위해 minikube에 CPU 2개·메모리 4GB를 할당하는 예시를 사용합니다. 호스트 운영체제와 Docker가 사용할 여유 자원도 필요합니다. 부족하면 Gateway 실습은 강사 시연으로 진행하세요.']}),
 S('OS에 맞게 설치합니다','아래 명령은 Docker와 패키지 관리자가 설치된 환경에서 실행합니다.',{kind:'SETUP',code:'# Windows PowerShell (winget 필요)\nwinget install -e --id Docker.DockerDesktop\nwinget install -e --id Kubernetes.minikube\nwinget install -e --id Kubernetes.kubectl\n\n# macOS (Homebrew 필요)\nbrew install --cask docker\nbrew install minikube kubectl',notes:['Windows: Docker Desktop 공식 Windows 설치 가이드의 지원 OS·WSL 2·가상화 요구사항을 먼저 확인합니다. 설치 후 Docker Desktop을 실행하고 Linux containers 모드를 사용합니다. 필요하면 재부팅합니다.','macOS: Intel/Apple Silicon에 맞는 Docker Desktop을 설치하고 앱을 한 번 실행합니다. Linux: 배포판별 Docker Engine 공식 절차를 따르고 현재 계정에서 docker info가 성공하도록 설정합니다. Linux용 minikube와 kubectl은 공식 페이지의 CPU 아키텍처별 바이너리 설치 절차를 사용합니다.','설치 권한·회사 네트워크·패키지 관리자 정책이 다르면 공식 설치 파일 방식을 사용합니다. 이 페이지의 명령을 실행했다고 Docker 엔진이 자동으로 준비되는 것은 아닙니다.'],sources:[...sources('mini'),['Docker 설치','https://docs.docker.com/engine/install/'],['Docker Desktop Windows','https://docs.docker.com/desktop/setup/install/windows-install/'],['kubectl 설치','https://kubernetes.io/docs/tasks/tools/']]}),
 S('클러스터를 만들고 연결을 확인합니다','터미널에서 다음 명령을 순서대로 실행합니다.',{kind:'LAB',code:'docker info\nminikube version\nkubectl version --client\nminikube start --driver=docker --cpus=2 --memory=4096\nminikube status\nkubectl config current-context\nkubectl get nodes',notes:['이후 Gateway 설치 전에는 선택한 Envoy Gateway 버전의 Kubernetes 호환성 표를 확인합니다. 스터디 구성원은 첫 모임에서 kubectl get nodes에 보이는 서버 버전을 기록하고 동일한 버전으로 맞추는 것이 좋습니다.','Context는 클러스터·사용자·기본 Namespace를 묶은 접속 설정입니다. 명령 실행 전 current-context가 minikube인지 확인하세요.'],expected:'minikube 상태가 Running이고 Node가 Ready입니다. 첫 이미지 다운로드에는 시간이 걸릴 수 있습니다.',trouble:'docker info가 실패하면 Docker 엔진부터 확인합니다. Node가 Ready가 아니면 minikube logs로 확인합니다. 인터넷 다운로드가 차단되면 승인된 이미지 미러나 사전 반입이 필요하며 명령만으로 해결되지 않습니다.'}),
 S('첫 앱을 실행해 봅시다','공개 예제 이미지를 실행하고, 내 컴퓨터의 포트로 연결합니다.',{kind:'LAB',code:'kubectl create namespace study\nkubectl -n study create deployment welcome --image=nginx:1.28-alpine\nkubectl -n study rollout status deployment/welcome\nkubectl -n study port-forward deployment/welcome 8080:80',notes:['브라우저에서 http://localhost:8080 을 엽니다. 이 터미널은 연결을 유지하므로 명령을 더 입력하려면 새 터미널을 열거나 Ctrl+C로 포트 포워딩을 종료합니다.','8080:80은 내 컴퓨터의 8080 포트를 선택된 Pod의 80 포트에 연결한다는 의미입니다. 외부 도메인이나 공인 IP가 필요하지 않습니다. 이미 Namespace가 있으면 AlreadyExists는 정상적으로 이해하고 다음 명령으로 진행합니다.'],expected:'Welcome to nginx! 페이지가 표시됩니다.',trouble:'8080을 다른 프로그램이 쓰면 18080:80으로 바꾸고 localhost:18080으로 접속합니다. ImagePullBackOff면 이미지 이름과 다운로드 접근을 확인합니다.'}),
 S('오늘 만든 환경은 다시 사용할 수 있습니다','중지는 보관, 삭제는 초기화입니다.',{code:'kubectl -n study get pods\nkubectl -n study delete deployment welcome\nminikube stop\n# 다음 스터디 시작 시\nminikube start\n# 전체 실습 환경을 버릴 때만: minikube delete',notes:['welcome Deployment만 삭제하면 다른 실습 리소스는 유지됩니다. 다음 주에는 같은 study Namespace에서 이어갑니다.','실습 명령은 프로젝트의 k8s/labs 폴더에서 실행하는 것으로 통일합니다. 웹 페이지로만 학습한다면 제공된 실습 파일을 같은 폴더에 저장하세요.'] }),
 Q('브라우저 접속이 끊겼는데 Pod는 Running입니다. 왜일까요?','포트 포워딩 터미널이 종료되었을 수 있습니다. Running은 컨테이너 실행 상태이고, 브라우저에서 Pod까지 연결이 유지된다는 의미는 아닙니다. port-forward 명령을 다시 실행하고 포트 번호를 확인하세요.')
]);
add('03','컨테이너와 Pod','내 앱을 Pod에서 실행하기','동일한 예제를 앞으로의 모든 실습에 사용합니다.',['docker','pods'],[
 S('이미지는 실행 재료, 컨테이너는 실행 결과','코드·런타임·설정을 이미지로 포장하면 같은 실행 재료를 전달할 수 있습니다.',{flow:['소스 파일','Dockerfile','이미지','컨테이너','Pod'],notes:['이 수업은 프레임워크 설치 시간을 줄이기 위해 별도 npm 의존성이 없는 작은 Node HTTP 서버를 제공합니다. HTML 페이지와 /api 응답을 함께 제공하므로 FE 요청 흐름에 집중할 수 있습니다.','실제 React/Vue 정적 앱은 보통 빌드 결과물을 웹 서버 이미지에 복사합니다. SSR 앱은 서버 런타임도 실행해야 합니다. 이 예제는 HTTP 서버 학습용이며 프로덕션 FE 배포 템플릿을 대신하지 않습니다.']}),
 S('실습 앱의 세 가지 주소','/는 화면, /api는 JSON, /healthz는 상태 확인용입니다.',{cards:[['GET /','버전과 Pod 이름, API 호출 버튼을 보여 줍니다.'],['GET /api','{ version, pod } 값을 반환합니다.'],['GET /healthz','상태 확인 요청에 ok를 반환합니다.']],file:'server.mjs',notes:['server.mjs를 다운로드하세요. API 버튼은 상대 경로 /api를 호출하므로 브라우저가 현재 접속한 호스트와 포트를 그대로 사용합니다. 클러스터 내부 Service 이름을 브라우저 코드에 넣지 않습니다.','서버는 0.0.0.0:8080에서 대기합니다. 컨테이너 안에서 127.0.0.1에만 바인딩하면 다른 Pod나 Service가 접근할 수 없습니다.']}),
 S('Dockerfile 한 줄씩 읽기','server.mjs와 Dockerfile을 같은 폴더에 저장합니다.',{code:dockerfile,file:'Dockerfile',notes:['FROM은 기반 이미지, WORKDIR은 작업 경로, COPY는 빌드 입력 복사입니다. CMD는 컨테이너 시작 시 실행할 명령입니다. USER node는 비루트 사용자로 프로세스를 실행합니다.','EXPOSE는 사용 포트에 대한 메타데이터입니다. 외부 포트를 자동으로 개방하지 않습니다. 로컬 연결은 docker run의 -p, Kubernetes 연결은 Service나 포트 포워딩으로 구성합니다.']}),
 S('이미지를 만들고 minikube로 전달하기','내 Docker에 있는 이미지가 minikube 안에도 자동으로 있다는 가정은 하지 않습니다.',{kind:'LAB',code:'docker build -t fe-study:v1 .\ndocker run --rm -p 18080:8080 fe-study:v1\n# localhost:18080 확인 후 Ctrl+C\nminikube image load fe-study:v1',notes:['첫 명령 마지막의 점은 현재 폴더가 빌드 컨텍스트라는 뜻입니다. Dockerfile과 server.mjs가 있는 폴더에서 실행합니다.','로컬 이미지는 레지스트리에 업로드하지 않고 minikube image load로 전달합니다. 여러 Node를 사용한다면 필요한 Node에 이미지가 있는지 별도로 확인합니다.'],expected:'localhost:18080에 Hello Kubernetes · v1이 표시되고 API 버튼을 누르면 JSON이 나타납니다.'}),
 S('Pod 선언을 읽어봅시다','metadata는 이름표, spec은 원하는 실행 설정입니다.',{code:pod,file:'pod.yaml',notes:['apiVersion과 kind는 어떤 종류의 API 객체인지 지정합니다. metadata.namespace는 study로 범위를 지정하고 labels.app은 나중에 대상을 찾는 이름표입니다.','imagePullPolicy: IfNotPresent는 로컬에 해당 이미지가 있으면 사용하는 설정입니다. 이미지 이름을 바꾸면 minikube에 새 이미지도 로드해야 합니다. containerPort는 앱 포트를 명시하지만 실제 서버가 그 포트에서 실행되어야 합니다.']}),
 S('직접 올리고 로그를 확인합니다','실습 파일을 저장한 폴더에서 실행하세요.',{kind:'LAB',code:'kubectl apply -f pod.yaml\nkubectl -n study get pods -o wide\nkubectl -n study describe pod hello\nkubectl -n study logs hello\nkubectl -n study port-forward pod/hello 8080:8080',notes:['이 서버는 요청 로그를 따로 출력하지 않으므로 logs가 비어 있어도 정상일 수 있습니다. describe의 Events는 이미지 다운로드·스케줄링 등의 상태를 보여줍니다.','종료할 때 포트 포워딩을 Ctrl+C로 끊고 kubectl -n study delete pod hello를 실행하세요. 단독 Pod는 삭제해도 다시 생성되지 않습니다. 다음 주에 이 차이를 확인합니다.'],expected:'Pod가 Running, READY가 1/1이고 localhost:8080에서 앱이 보입니다.',trouble:'ErrImagePull/ImagePullBackOff라면 fe-study:v1 로드 여부를 확인합니다. Pending이면 describe의 Events에서 자원 부족 등 스케줄링 원인을 확인합니다.'}),
 Q('EXPOSE 8080을 쓰면 브라우저에서 바로 접속할 수 있나요?','아닙니다. 앱이 포트를 열고 있어야 하며, 컨테이너나 클러스터 밖에서 접근하려면 별도 연결 경로가 필요합니다. 이번에는 port-forward를 사용합니다.')
]);
add('04','Deployment와 설정','앱이 계속 실행되도록','복제·복구·설정 분리를 하나의 앱에서 관찰합니다.',['deploy','rs','config','secret'],[
 S('Pod를 직접 관리하면 빠지는 것','단독 Pod를 삭제하면 그 이름의 새 Pod가 자동 생성되지 않습니다.',{flow:['Deployment: 버전 관리','ReplicaSet: 개수 유지','Pod: 실제 실행'],notes:['ReplicaSet은 selector에 맞는 Pod 수를 유지합니다. Deployment를 쓰면 보통 ReplicaSet을 직접 만들거나 편집할 필요가 없습니다. 새 Pod 템플릿을 반영할 때 Deployment가 ReplicaSet을 관리합니다.','replicas를 늘리는 것은 같은 역할을 할 앱 인스턴스를 늘리는 것입니다. 파일이나 로그인 세션을 Pod 메모리에만 저장하면 다른 인스턴스에서 보이지 않는 문제를 고려해야 합니다.']}),
 S('Deployment YAML의 연결 고리','selector.matchLabels와 template.metadata.labels가 일치해야 합니다.',{code:deploy,file:'deployment.yaml',notes:['selector는 이 Deployment가 관리할 Pod의 이름표 조건입니다. template은 새 Pod를 만들 때 사용할 양식입니다. replicas: 3은 원하는 개수입니다.','APP_VERSION은 서버가 시작할 때 읽어 응답에 표시하는 값입니다. 실제 코드 업데이트는 새 이미지를 만들어 반영하지만, 먼저 설정 변화도 Pod 템플릿 변경임을 관찰합니다.']}),
 S('복구를 직접 관찰해 봅시다','실제 Pod 이름 하나를 선택해 삭제한 뒤 목록을 다시 확인합니다.',{kind:'LAB',code:'kubectl apply -f deployment.yaml\nkubectl -n study rollout status deployment/frontend\nkubectl -n study get deployment,replicaset,pods\n# 아래 POD_NAME을 위 목록의 실제 이름으로 바꾸세요\nkubectl -n study delete pod POD_NAME\nkubectl -n study get pods -w',notes:['-w는 변경을 계속 보여주는 watch 모드입니다. 새 Pod 이름과 나이를 관찰하고 Ctrl+C로 나옵니다. Pod를 삭제해도 Deployment가 선언한 replicas 값은 바뀌지 않습니다.','컨테이너 재시작은 같은 Pod 안에서 프로세스가 다시 실행되는 것이고, Pod 재생성은 다른 UID와 이름을 가진 새 Pod가 만들어지는 것입니다.'],expected:'삭제한 Pod와 다른 이름의 Pod가 생성되어 다시 3개가 유지됩니다.',trouble:'노트북 자원이 부족하면 kubectl -n study scale deployment frontend --replicas=2로 실습 크기를 줄이세요.'}),
 S('설정은 이미지 밖으로 분리합니다','비밀이 아닌 설정에는 ConfigMap, 민감한 값 전달에는 Secret을 사용합니다.',{code:config,file:'configmap.yaml',notes:['kubectl apply -f configmap.yaml 이후 kubectl -n study set env deployment/frontend --from=configmap/frontend-config를 실행합니다. Pod 템플릿의 환경 변수 참조가 바뀌면서 새 배포가 시작됩니다.','환경 변수로 주입한 ConfigMap 값은 기존 프로세스에서 자동 갱신되지 않습니다. 값을 수정했다면 kubectl -n study rollout restart deployment/frontend로 새 Pod를 띄워 반영할 수 있습니다. 파일 마운트는 갱신 방식이 다르며 앱도 변경을 읽어야 합니다.'],expected:'새 Pod 응답에 local-study 버전 문자열이 나타납니다.'}),
 S('FE 환경 변수는 어디서 읽힐까요?','빌드 때 JS에 들어간 값과 서버 실행 시 읽는 값은 반영 시점이 다릅니다.',{cards:[['빌드 시점','Vite 등의 도구가 값을 번들에 포함하면 이미지를 다시 빌드해야 바뀝니다.'],['실행 시점','서버가 시작할 때 환경 변수를 읽거나 별도 설정 파일을 내려줄 수 있습니다.'],['브라우저 노출','번들·HTML·응답으로 전달된 값은 사용자에게 보입니다. 비밀 키를 넣지 않습니다.']],notes:['우리 예제는 서버가 실행 시 APP_VERSION을 읽습니다. 정적 FE 앱의 import.meta.env와 같은 빌드 설정과 동작이 같다고 생각하면 안 됩니다.','Secret의 base64 표현은 암호화가 아닙니다. 접근 제어·저장 시 암호화 같은 운영 설정도 필요합니다. 이 과정에서는 실제 비밀을 입력하거나 Git에 저장하는 실습을 하지 않습니다.']}),
 Q('replicas를 3에서 5로 바꾸면 새 버전인가요?','복제 개수만 변경한 것은 새 Pod 템플릿 버전이 아닙니다. 반면 spec.template 아래의 이미지·환경 변수 같은 변경은 새 Rollout을 유발합니다.',['다음 실습 전에 kubectl apply -f deployment.yaml을 실행해 기본 3개·APP_VERSION=v1 상태로 맞춥니다.'])
]);
add('05','Service · 도메인 · VIP','이름과 주소를 연결하기','바뀌는 Pod 앞에 안정적인 접점을 둡니다.',['svc','vip','dns'],[
 S('Pod는 바뀌어도 접속 방법은 유지되어야 합니다','Service는 대상 Pod 묶음에 접근할 안정적인 접점을 제공합니다.',{flow:['클라이언트','Service','선택된 Pod'],notes:['새 Pod가 만들어지면 주소가 달라질 수 있습니다. 클라이언트가 Pod IP를 코드에 직접 고정하면 교체 때 연결이 끊깁니다.','Service의 selector는 라벨로 대상을 찾습니다. EndpointSlice에는 실제 연결 대상 정보가 관리됩니다. Service는 항상 독립된 프록시 프로세스 하나가 떠 있는 구조가 아니며, 네트워크 구현이 규칙을 반영합니다.']}),
 S('Service의 포트를 읽어봅시다','Service의 80번 포트를 실제 앱의 8080번 포트로 연결합니다.',{code:service,file:'service.yaml',notes:['이 Service는 app: frontend 라벨의 Pod를 대상으로 합니다. Deployment 이름이 같아서 연결되는 것이 아니라 selector 조건이 맞아서 연결됩니다.','kubectl apply -f service.yaml 후 kubectl -n study get svc frontend와 kubectl -n study get endpointslice -l kubernetes.io/service-name=frontend로 대상 정보를 확인하세요.'],expected:'ClusterIP가 할당되고 EndpointSlice에 frontend Pod 주소가 나타납니다.'}),
 S('도메인은 이름, VIP는 가상 주소','일반적인 ClusterIP Service는 클러스터 내부 VIP를 갖습니다.',{cards:[['도메인','사람이 사용하는 이름. DNS는 그 이름의 IP 주소 등을 조회합니다.'],['VIP','특정 Pod 하나의 IP 대신 서비스 접점을 나타내는 가상 IP.'],['Pod IP','앱이 실제 실행되는 Pod의 네트워크 주소.']],callout:'도메인 발급·DNS 등록·hosts 수정 실습은 하지 않습니다. 아래 주소는 설명용입니다.',notes:['VIP가 있다고 해서 반드시 공인 IP인 것은 아닙니다. Service ClusterIP는 기본적으로 클러스터 내부에서 쓰는 주소입니다. 외부 진입점 VIP와 Service ClusterIP는 구분합니다.','Headless Service는 clusterIP: None으로 일반적인 VIP 없이 DNS로 Endpoint를 찾는 경우입니다. 이번 과정은 기본 ClusterIP Service에 집중합니다.']}),
 S('외부 도메인이 VIP로 매핑된다면','외부 진입점이 VIP를 제공하는 구성을 가정한 예시입니다.',{flow:['app.example.com','DNS 조회: 203.0.113.10','외부 진입점','Gateway / Ingress','대상 Service → Pod'],code:'DNS A 레코드 예시\napp.example.com  →  203.0.113.10\n\n클러스터 내부의 일반 Service DNS 예시\nfrontend.study.svc.cluster.local  →  10.96.0.20',notes:['203.0.113.10은 문서 설명용 주소입니다. 브라우저는 DNS 응답으로 얻은 주소에 접속하고, HTTP Host와 경로를 전달합니다. Gateway/Ingress는 이 조건으로 목적지를 고릅니다. DNS가 HTTP 요청을 중계하는 것은 아닙니다.','내부 Service DNS 이름은 클러스터 도메인이 cluster.local인 일반적 예시입니다. 실제 ClusterIP는 kubectl get svc로 확인합니다. 외부 도메인을 내부 VIP에 적는 것만으로 외부 접속 경로가 생기지는 않습니다.']}),
 S('내부 DNS를 직접 확인합니다','도메인을 발급하지 않아도 클러스터 내부 Service 이름을 조회할 수 있습니다.',{kind:'LAB',code:'kubectl -n study run dnscheck --image=busybox:1.37 --restart=Never --command -- sleep 3600\nkubectl -n study exec dnscheck -- nslookup frontend.study.svc.cluster.local\nkubectl -n study exec dnscheck -- wget -qO- http://frontend/api\nkubectl -n study delete pod dnscheck\nkubectl -n study port-forward service/frontend 8080:80',notes:['dnscheck가 Running이 된 후 exec를 실행합니다. 외부 이미지 다운로드가 허용된 환경에서 사용합니다. 마지막 명령 후 브라우저 localhost:8080으로 접속할 수 있습니다.','포트 포워딩은 Service가 선택한 Pod 한 개로 연결됩니다. 따라서 브라우저를 새로고침해도 Pod 이름이 계속 같을 수 있습니다. 이것으로 Service 전체의 부하 분산을 검증하지 않습니다.'],expected:'DNS 조회 결과에 Service ClusterIP가 보이고 내부 HTTP 요청은 JSON을 반환합니다.',trouble:'EndpointSlice가 비어 있다면 Pod 라벨·Service selector·Readiness부터 확인하세요. 브라우저는 클러스터 내부 DNS를 일반적으로 직접 조회할 수 없습니다.'}),
 S('외부 노출 방식도 구분합니다','Service type은 접속 범위를 이해하는 출발점입니다.',{cards:[['ClusterIP','클러스터 내부 접속. 이번 실습의 기본값.'],['NodePort','Node의 특정 포트를 통해 접근하는 형태. 로컬 드라이버별 접근 차이가 있습니다.'],['LoadBalancer','외부 로드밸런서 구현과 연동. 선언만으로 모든 환경에 외부 주소가 생기지 않습니다.']],notes:['minikube tunnel은 일부 LoadBalancer 접속을 지원하지만 이 수업의 필수 경로가 아닙니다. 직접 내부 IP로 접근하려고 네트워크 설정을 바꾸지 않고 port-forward를 사용합니다.']}),
 Q('Service가 Pod를 찾지 못할 때 먼저 무엇을 볼까요?','Service selector와 Pod labels의 일치 여부, EndpointSlice의 주소와 readiness를 확인합니다. DNS가 정상이어도 실제 대상이 없으면 요청은 처리되지 않습니다.')
]);
add('06','Ingress와 요청 라우팅','외부 요청의 입구 이해하기','호스트와 경로에 따라 목적지를 선택합니다.',['ingress'],[
 S('리버스 프록시는 요청을 대신 전달합니다','브라우저가 내부 서버 주소를 모두 알 필요 없도록 앞에서 요청을 받아 전달합니다.',{flow:['브라우저: /api','리버스 프록시','API Service','API Pod'],notes:['일반적인 네트워크 게이트웨이는 다른 네트워크로 패킷을 보내는 출구입니다. 여기서 다룰 HTTP 리버스 프록시는 호스트·경로 같은 HTTP 정보를 보고 백엔드를 고릅니다.','Ingress는 이 라우팅 규칙을 선언하는 Kubernetes 리소스입니다. Controller와 실제 프록시 구현이 있어야 규칙이 동작합니다. 이 주차는 리소스 읽기와 요청 추적에 집중하고, 실제 프록시 설치 실습은 7주차 Gateway API에서 통일합니다.']}),
 S('Ingress 리소스와 Controller는 다릅니다','규칙을 저장했다고 트래픽을 처리하는 프로그램까지 자동 설치되지는 않습니다.',{cards:[['Ingress','호스트·경로와 대상 Service를 적은 규칙.'],['IngressClass','어떤 Controller가 처리할지 구분하는 설정.'],['Controller / Proxy','규칙을 읽고 실제 요청 전달을 구현하는 구성 요소.']],notes:['Ingress API는 기능 확장이 동결되어 있으며 Gateway API가 확장된 기능을 제공합니다. 기존 서비스에서는 Ingress를 많이 만나므로 YAML을 읽을 수 있어야 합니다.','특정 Ingress Controller 프로젝트의 지원 상태와 Kubernetes Ingress API 자체를 혼동하지 마세요. 이번 자료는 오래된 Controller를 새로 설치하도록 안내하지 않습니다.']}),
 S('도메인 없이도 경로 규칙을 읽을 수 있습니다','이 예시는 /로 시작하는 요청을 frontend Service의 80번 포트에 연결합니다.',{code:ingress,file:'ingress-reference.yaml',notes:['host를 생략했으므로 특정 도메인만 요구하지 않는 규칙입니다. ingressClassName: example-controller는 설명용 이름입니다. 이 파일은 설치용이 아니며 그대로 apply하는 것을 실습 목표로 삼지 않습니다.','실제 Controller가 설치된 환경에서는 그 구현체의 IngressClass를 사용해야 합니다. 백엔드 포트는 Pod의 8080이 아니라 Service의 port 80입니다.']}),
 S('라우팅과 경로 변경은 별개입니다','/api 요청을 API Service로 보내도 /api 접두어가 자동 삭제되는 것은 아닙니다.',{cards:[['라우팅','어느 백엔드가 받을지 결정합니다.'],['Rewrite','백엔드에 전달할 경로 등을 바꾸는 별도 기능입니다.'],['TLS 종료','HTTPS를 받은 진입점에서 복호화하는 구성입니다.']],notes:['API가 /users만 받는데 프록시가 /api/users를 그대로 전달하면 404가 날 수 있습니다. 요청이 전달되지 않은 것과 전달 후 앱이 404를 응답한 것은 다릅니다.','TLS는 인증서와 신뢰 관계가 필요합니다. 이번에는 인증서 발급 실습 없이 개념만 설명합니다. 외부 HTTPS 종료 뒤 내부 요청도 암호화할지는 별도의 설계입니다.']}),
 S('FE에서 자주 만나는 두 가지 오류','새로고침 404와 CORS 오류는 원인과 확인 위치가 다릅니다.',{cards:[['SPA 새로고침 404','/products를 웹 서버가 파일 경로로만 해석하면 발생할 수 있습니다. HTML fallback을 확인합니다.'],['CORS','브라우저의 다른 Origin 요청 제약입니다. scheme·host·port 중 하나가 달라도 Origin이 다릅니다.'],['프록시 연결 실패','대상 Service·포트·Endpoint·Pod 상태를 확인합니다.']],notes:['SPA fallback은 API나 실제 정적 파일 오류까지 무조건 index.html로 바꾸지 않도록 서버 설정을 구분해야 합니다.','localhost:8080 화면에서 localhost:9000 API를 호출하면 다른 Origin입니다. 반면 현재 예제의 fetch("/api")는 같은 Origin으로 요청하고 프록시가 내부 목적지를 선택할 수 있습니다.']}),
 Q('DNS는 정상인데 /api만 404입니다. DNS를 수정할까요?','우선 Host·경로 매칭, 백엔드로 전달되는 실제 경로, 앱이 지원하는 URL을 확인합니다. DNS는 이미 접속할 주소를 알려준 상태이며 경로별 404를 직접 결정하지 않습니다.',['토론: 브라우저 개발자 도구에서 상태 코드와 응답 본문을 확인하고, 앱 로그·프록시 로그에서 요청 도착을 확인하는 순서를 설명해 보세요.'])
], '개념 + 요청 추적');
add('07','Gateway API','요청 라우팅을 직접 구성하기','도메인 없이 localhost에서 Gateway를 거칩니다.',['gateway','envoy'],[
 S('Gateway API는 역할을 나눕니다','누가 입구를 운영하고, 누가 앱의 경로를 정의하는지 구분합니다.',{cards:[['GatewayClass','사용할 구현을 정의. 이 수업에서는 Envoy Gateway.'],['Gateway','HTTP Listener 같은 트래픽 수신 설정.'],['HTTPRoute','어떤 요청을 어느 Service에 보낼지 정의.']],notes:['Gateway API는 Kubernetes에 확장 리소스(CRD)로 설치됩니다. CRD는 API 서버가 새 종류의 리소스를 알게 하고, Controller는 그 리소스의 동작을 구현합니다.','이번에는 같은 사람이 세 리소스를 작성하지만 팀에서는 플랫폼 담당자가 Gateway를, 앱 개발자가 HTTPRoute를 관리할 수 있습니다. ReferenceGrant 같은 네임스페이스 간 권한은 심화 주제로 남깁니다.']}),
 S('실습 준비: Envoy Gateway 설치','2~5주차의 클러스터·이미지·Deployment·Service가 준비된 상태에서 진행합니다.',{kind:'SETUP',code:'# Helm을 공식 설치 안내에 따라 먼저 설치합니다.\nhelm version\nhelm install eg oci://docker.io/envoyproxy/gateway-helm --version v1.9.1 -n envoy-gateway-system --create-namespace\nkubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available',notes:['v1.9.1은 문서 확인 시점의 공식 Quickstart 예시입니다. 실행 전에 공식 Compatibility Matrix와 자신의 Kubernetes 버전을 대조하세요. 외부 이미지·Helm 차트 다운로드가 필요합니다. 이미 설치되어 있다면 반복 install 대신 helm list -n envoy-gateway-system으로 상태를 확인합니다.','이 Helm 설치는 Gateway API CRD도 설치합니다. 수업은 기존 CRD가 없는 로컬 클러스터 기준입니다. 공식 Quickstart의 별도 예제 앱은 설치하지 않고, 다음 슬라이드부터 우리의 frontend 앱을 연결합니다.'],sources:[...sources('envoy'),['Helm 설치','https://helm.sh/docs/intro/install/'],['호환성 표','https://gateway.envoyproxy.io/news/releases/matrix/']],expected:'envoy-gateway Deployment가 Available 상태입니다.',trouble:'no matches for kind는 CRD 준비 여부를 확인합니다. Helm 네트워크 접근이 제한되면 강사가 승인된 차트·이미지를 사전 제공해야 합니다.'}),
 S('GatewayClass와 Gateway 만들기','호스트 이름 조건 없이 HTTP 80번 Listener를 만듭니다.',{code:gateway,file:'gateway.yaml',notes:['kubectl apply -f gateway.yaml을 실행합니다. GatewayClass는 클러스터 범위이며 Gateway는 study Namespace에 있습니다. controllerName은 Envoy Gateway 구현이 처리할 값입니다.','allowedRoutes의 Same은 같은 Namespace의 Route만 붙이도록 제한합니다. 여기서는 frontend HTTPRoute도 study에 생성합니다. 외부 주소가 없어도 뒤에서 프록시 Service로 포트 포워딩할 수 있습니다.']}),
 S('HTTPRoute로 앱을 연결합니다','이 리소스는 Gateway를 부모로 삼고 frontend Service를 대상으로 삼습니다.',{code:route,file:'route.yaml',notes:['kubectl apply -f route.yaml을 실행합니다. parentRefs.name은 Gateway 이름, backendRefs.name은 Service 이름입니다. port: 80은 Service 포트입니다.','hostnames를 지정하지 않아 localhost 요청을 허용합니다. /와 /api 요청은 모두 같은 샘플 앱으로 갑니다. 이는 앱을 단순화하기 위한 것으로 운영에서 FE·API Service를 분리할 수도 있습니다.']}),
 S('프록시 Service를 찾아 localhost로 연결하기','Controller 관리 포트가 아니라 생성된 Envoy 프록시의 Service를 선택합니다.',{kind:'LAB',code:'kubectl -n study get gateway,httproute\nkubectl -n study describe httproute frontend\nkubectl -n envoy-gateway-system get svc -l gateway.envoyproxy.io/owning-gateway-name=study-gateway\n# 실제 출력의 Service 이름으로 ENVOY_SERVICE_NAME을 바꾸세요.\nkubectl -n envoy-gateway-system port-forward svc/ENVOY_SERVICE_NAME 8888:80',notes:['브라우저에서 http://localhost:8888 과 http://localhost:8888/api 를 확인합니다. 이 연결은 프록시 Pod로 들어간 뒤 HTTPRoute에 따라 backend를 고르므로 Service 직접 포워딩과 다릅니다.','HTTPRoute의 Accepted·ResolvedRefs 상태를 확인합니다. 외부 LoadBalancer가 없는 로컬 환경에서는 Gateway Address가 비어 있거나 관련 조건이 아직 준비되지 않을 수 있습니다. 프록시 Pod가 Running이고 경로가 수락되었는지 함께 확인하세요.'],expected:'localhost:8888에서 샘플 화면과 API JSON이 보입니다.',trouble:'404면 HTTPRoute 연결과 경로를, 503 등 업스트림 오류면 Service·EndpointSlice·Pod readiness를 확인합니다. 아직 Envoy Service가 없다면 Controller 로그와 Gateway 상태를 확인합니다.'}),
 Q('HTTPRoute에 적는 80은 Pod 포트인가요?','아닙니다. backendRefs의 port는 대상 Service의 포트입니다. Service가 targetPort: 8080으로 Pod에 연결합니다.',['전체 흐름을 말해 보세요: localhost:8888 → 포트 포워딩 → Envoy 프록시 → HTTPRoute 목적지 선택 → frontend Service의 대상 Pod. 실제 프록시는 Service VIP 대신 Endpoint에 직접 연결할 수도 있습니다.'])
]);
add('08','Traffic Distribution','어디로, 얼마나 보낼까','위치 선호도와 버전별 가중치를 구분합니다.',['svc','vip','split'],[
 S('트래픽 분산에는 서로 다른 질문이 있습니다','가까운 Pod를 고르는 것과 새 버전에 일부 요청을 보내는 것은 다릅니다.',{cards:[['기본 분산','사용 가능한 여러 대상에 연결을 나눕니다.'],['위치 선호','같은 Node·Zone의 대상을 선호할 수 있습니다.'],['버전 비율','v1과 v2 서비스로 보내는 요청 비중을 정합니다.']],notes:['Service 프록시 방식은 구현에 따라 다릅니다. 매 HTTP 요청이 정확히 순서대로 다른 Pod로 가는 라운드로빈이라고 단정하지 마세요. 연결 재사용 때문에 같은 Pod로 여러 요청이 갈 수 있습니다.','이번 주는 버전별 비율을 실제로 관찰합니다. 위치 선호도는 단일 Node 로컬 클러스터에서 차이를 검증하기 어려우므로 그림과 YAML 읽기로 학습합니다.']}),
 S('Service의 trafficDistribution','같은 Zone·Node 등 네트워크 위치에 따른 선호도를 표현합니다.',{code:'# 학습용 필드 예시. 지원 버전을 먼저 확인합니다.\nspec:\n  trafficDistribution: PreferSameZone\n\n# 설치된 서버 API가 제공하는 설명 확인\n# kubectl explain service.spec.trafficDistribution',notes:['PreferClose는 가까운 Endpoint, 일반적으로 같은 Zone을 선호하는 값입니다. PreferSameZone은 같은 Zone, PreferSameNode는 같은 Node를 선호하는 의미를 더 명시적으로 드러냅니다. 지원 여부·feature gate는 Kubernetes 버전에 따라 다르므로 현재 서버 설명과 공식 문서를 확인합니다.','이는 트래픽 비율 90:10이나 엄격한 접근 제한이 아닙니다. internalTrafficPolicy 또는 externalTrafficPolicy가 Local일 때는 해당 트래픽에 로컬 Endpoint 제약이 우선합니다. 로컬 대상이 없을 때의 동작도 선호도 fallback과 혼동하지 마세요.'],callout:'Pod를 어느 Node에 배치할지 정하는 스케줄링 설정도 아닙니다.'}),
 S('v1과 v2를 별도 대상으로 준비합니다','같은 코드 이미지의 APP_VERSION만 달리해 라우팅 관찰용 v2를 만듭니다.',{kind:'LAB',code:'kubectl apply -f deployment.yaml\nkubectl apply -f service.yaml\nkubectl apply -f v2.yaml\nkubectl -n study rollout status deployment/frontend-v2\nkubectl -n study get deployment,service',file:'v2.yaml',notes:['v2.yaml은 app: frontend-v2 라벨을 사용하는 Deployment와 Service입니다. v1의 frontend selector와 겹치지 않습니다. 여기서 v2는 실제 코드 업데이트가 아니라 요청 분산을 눈으로 확인하기 위한 환경 변수 표시입니다.','다운로드 파일에는 전체 YAML이 포함되어 있습니다. frontend는 3개, frontend-v2는 2개 Pod를 사용하므로 노트북 자원을 확인하세요.'],expected:'frontend와 frontend-v2라는 두 Service 및 두 Deployment가 보입니다.'}),
 S('Gateway에서 90:10 가중치로 분할합니다','가중치의 합에 대한 비율로 요청을 분할합니다.',{code:split,file:'split.yaml',notes:['kubectl apply -f split.yaml은 이전 HTTPRoute frontend를 수정합니다. backendRefs에서 frontend의 weight는 90, frontend-v2는 10입니다. 합이 반드시 100일 필요는 없지만 수업에서는 이해하기 쉽게 맞춥니다.','Gateway API 가중치는 기대 비율입니다. 10번 호출했다고 반드시 v2가 1번 나오는 보장은 없습니다. 결과를 판단할 때 충분한 샘플 수와 프록시 동작을 고려합니다.']}),
 S('요청을 모아 실제 비율을 관찰하기','7주차의 Envoy 프록시 포트 포워딩을 켠 상태에서 새 터미널을 사용합니다.',{kind:'LAB',code:'# Windows PowerShell\n1..100 | ForEach-Object { (Invoke-RestMethod http://localhost:8888/api).version } | Group-Object\n\n# macOS / Linux shell\nfor i in $(seq 1 100); do curl -s http://localhost:8888/api; echo; done',notes:['PowerShell은 v1·v2별 개수를 그룹으로 표시합니다. macOS/Linux 명령은 JSON을 한 줄씩 보여주므로 버전 값으로 개수를 세어 봅니다. 다른 포트의 Service 직접 포워딩 결과와 혼동하지 마세요.','split.yaml의 weight를 50:50으로 바꾸고 다시 apply한 뒤 반복합니다. 마지막에 kubectl apply -f route.yaml로 단일 frontend 경로를 복원합니다.'],expected:'충분한 호출에서 가중치에 가까운 경향을 관찰합니다. 정확한 일치가 검증 기준은 아닙니다.',trouble:'한 버전만 보이면 API 응답의 version, HTTPRoute의 현재 backendRefs, Accepted 상태 및 대상 Service의 Endpoint를 확인합니다.'}),
 Q('Pod 수가 v1 3개, v2 2개면 HTTPRoute의 90:10이 무효인가요?','아닙니다. Gateway가 Service 간 요청 비율을 선택한 뒤 각 Service의 Endpoint로 전달합니다. Pod 개수와 Service 간 가중치는 다른 설정입니다. 단, 실제 처리 용량은 Pod 개수와 자원에 영향을 받습니다.')
]);
add('09','Rollout · 배포 전략','새 버전을 안전하게 전달하기','롤링 업데이트·블루-그린·카나리를 그림으로 비교합니다.',['deploy','probe','blue','canary'],[
 S('Rollout은 새 상태를 실제 환경에 펼치는 과정','배포 전략은 기존 버전을 어떤 순서로 교체하고, 사용자 요청을 언제 전환할지 정합니다.',{cards:[['Rollout','새 이미지나 Pod 템플릿을 실행 환경에 반영.'],['Rolling Update','기존 Pod를 점진적으로 교체하는 전략.'],['Rollback','문제가 있는 변경을 이전 상태로 되돌림.']],notes:['이름이 비슷해도 Rollout은 전체 과정, Rolling Update는 한 가지 배포 전략입니다. Deployment는 기본적으로 RollingUpdate 전략을 지원합니다.','Argo Rollouts는 별도의 Controller와 Rollout 리소스를 제공하는 프로젝트입니다. kubectl rollout 명령을 사용하기 위해 Argo Rollouts를 설치할 필요는 없습니다.']}),
 S('롤링 업데이트: 조금씩 교체합니다','기존 Pod를 일부 유지하면서 새 Pod를 만들고, 준비되면 기존 Pod를 줄입니다.',{strategy:'rolling',notes:['그림은 replicas=3, maxSurge=1, maxUnavailable=0의 단순화된 순서입니다. 새 Pod가 Ready가 되기 전에는 기존 처리 용량을 줄이지 않는 의도를 표현합니다. 종료 중인 Pod 등 실제 순간 개수는 더 복잡할 수 있습니다.','일반적인 Deployment에서 시작하기 쉽고 추가 자원이 비교적 적습니다. 다만 배포 중 v1·v2가 동시에 요청을 받으므로 API·세션·정적 자산 호환성을 고려해야 합니다. 실패한 새 Pod가 Ready가 되지 않으면 진행이 멈출 수 있습니다.'],callout:'Pod를 교체하는 전략이지, 사용자 요청을 정확히 10%씩 나누는 기능은 아닙니다.'}),
 S('블루-그린: 준비한 뒤 목적지를 전환합니다','Blue가 서비스하는 동안 Green을 별도로 준비하고 검증합니다.',{strategy:'bluegreen',notes:['Blue와 Green은 버전 환경을 구분하는 이름입니다. 전환 전 Green은 별도 검증 경로로 테스트하고, 준비되면 운영 요청의 목적지를 바꿉니다.','이전 환경을 유지하면 되돌리기 쉬운 편이지만 두 환경을 동시에 띄우는 자원이 필요합니다. 연결 유지와 라우팅 규칙 전파 때문에 모든 기존 연결이 정확히 같은 순간에 바뀌는 것은 아닙니다. DB 스키마 등 외부 상태는 트래픽 전환만으로 복구되지 않습니다.'],sources:sources('blue')}),
 S('카나리: 일부 요청으로 먼저 검증합니다','새 버전으로 보내는 비율을 낮게 시작하고 결과를 확인하며 늘립니다.',{strategy:'canary',notes:['v1 90%·v2 10% → 50%·50% → v2 100%라는 계획을 예로 듭니다. 각 단계에서 오류율·응답 시간·핵심 사용자 동작을 확인합니다. 실패하면 v2 비중을 줄이거나 중단합니다.','8주차의 HTTPRoute weight 변경이 요청 분할의 기본 메커니즘입니다. 그것만으로 자동 분석·승인·롤백까지 생기는 것은 아닙니다. Argo Rollouts 같은 도구는 지원되는 라우터 연동과 분석 설정을 통해 이를 자동화할 수 있습니다.'],sources:sources('canary','split')}),
 S('세 전략, 어떤 차이가 있을까요?','교체 단위·추가 자원·검증 방식으로 비교해 보세요.',{cards:[['Rolling Update','Pod를 순차 교체. 비교적 적은 추가 자원. 구·신버전 공존을 고려.'],['Blue-Green','두 환경 준비 후 전환. 더 많은 자원. 전환 전 검증과 빠른 경로 복귀.'],['Canary','일부 요청부터 확대. 실제 트래픽으로 검증. 지표와 라우팅 제어가 필요.']],notes:['빠른 전환이 중요하고 추가 환경 비용을 감당할 수 있다면 Blue-Green을 검토할 수 있습니다. 실제 사용자 요청으로 위험을 제한하며 관찰하려면 Canary가 도움이 됩니다. 일반적인 Stateless 앱의 기본 업데이트에는 Rolling Update부터 이해하면 좋습니다.','어떤 전략도 앱·DB의 하위 호환성을 자동으로 해결하지 않습니다. 이번 스터디에서는 세 전략만 비교하고 Argo Rollouts 설치 실습은 하지 않습니다.']}),
 S('준비된 Pod만 요청을 받아야 합니다','Probe마다 실패했을 때의 동작이 다릅니다.',{cards:[['Readiness','요청을 받아도 되는가? 실패 시 일반 Service의 준비된 대상에서 제외.'],['Liveness','회복을 위해 컨테이너를 재시작해야 하는가?'],['Startup','시작이 오래 걸리는 앱의 초기화 완료를 기다림. 성공 전 다른 Probe를 지연.']],file:'probes-patch.yaml',notes:['다운로드한 probes-patch.yaml은 전체 리소스가 아닌 Deployment patch입니다. kubectl -n study patch deployment frontend --patch-file probes-patch.yaml로 적용합니다. /healthz 응답은 실습용으로 단순화되어 있습니다.','외부 API가 잠깐 느리다고 Liveness를 실패시켜 모든 Pod를 재시작하는 구성은 문제를 악화할 수 있습니다. Readiness와 Liveness의 판단 기준은 앱 특성에 맞게 설계합니다. CPU requests 50m은 0.05 CPU이며 limits는 사용 상한 설정입니다.']}),
 S('실습: 실패한 Rollout을 복구합니다','잘못된 이미지 태그를 지정해 배포가 멈추는 상태를 관찰합니다.',{kind:'LAB',code:'kubectl apply -f route.yaml\nkubectl -n study patch deployment frontend --patch-file probes-patch.yaml\nkubectl -n study rollout status deployment/frontend\nkubectl -n study set image deployment/frontend web=fe-study:does-not-exist\nkubectl -n study rollout status deployment/frontend --timeout=60s\nkubectl -n study get pods\nkubectl -n study rollout history deployment/frontend\nkubectl -n study rollout undo deployment/frontend\nkubectl -n study rollout status deployment/frontend',notes:['시작 전에 정상 v1 이미지가 로드되어 있고 기존 3개 Pod가 Ready인지 확인합니다. 새로운 잘못된 이미지는 가져올 수 없어 새 Pod가 Ready가 되지 않습니다. maxUnavailable: 0이므로 정상 기존 Pod를 유지하려고 합니다.','rollout undo는 이전 Pod 템플릿으로 되돌립니다. ConfigMap 내용이나 DB 변경 등 모든 외부 상태를 되돌리는 명령은 아닙니다. 복구 후 Git이나 로컬 YAML도 올바른 상태여야 다음 apply에서 잘못된 값을 다시 넣지 않습니다.'],expected:'새 Pod에 이미지 오류가 나타나고 rollout status는 시간 초과할 수 있습니다. undo 후 정상 ReplicaSet으로 수렴합니다.',trouble:'기존 Pod까지 비정상이면 describe와 이전 이미지 가용성부터 확인합니다. 포트 포워딩한 Pod가 교체되면 터널을 다시 열어야 할 수 있습니다.'}),
 Q('새 버전이 Ready라면 카나리 검증은 끝난 걸까요?','아닙니다. Ready는 요청 처리 준비 상태의 신호입니다. 실제 오류율, 지연, 구매·로그인 같은 사용자 동작까지 성공한다는 보장은 없으므로 관찰 기준이 필요합니다.')
]);
add('10','종합 실습 · Argo CD','연결하고, 진단하고, 설명하기','전체 흐름을 완성하고 Git 기반 배포를 맛봅니다.',['debug','argo','rollouts'],[
 S('마지막 미션: 요청 한 번을 끝까지 설명하기','localhost에서 시작한 요청이 어떤 설정을 거쳐 어떤 Pod에 도착하는지 설명합니다.',{flow:['Browser :8888','Envoy Proxy','HTTPRoute','Service 대상','Pod :8080'],notes:['앞선 실습의 study Namespace와 Envoy Gateway가 준비된 상태에서 진행합니다. 순서는 Deployment·Service 복원 → Gateway/HTTPRoute 확인 → 프록시 포트 포워딩 → 화면/API 확인입니다.','실습 50분·장애 진단 30분·발표 20분·Argo CD 소개 20분의 예시 진행안입니다. 팀마다 한 사람이 설명하고 다른 사람이 명령 결과로 검증해 보세요.']}),
 S('기본 상태로 맞추고 연결합니다','9주차까지 작성한 파일을 그대로 사용합니다.',{kind:'LAB',code:'kubectl apply -f deployment.yaml\nkubectl apply -f service.yaml\nkubectl apply -f gateway.yaml\nkubectl apply -f route.yaml\nkubectl -n study rollout status deployment/frontend\nkubectl -n study get pods,svc,gateway,httproute\nkubectl -n study get endpointslice',notes:['7주차 방식으로 Envoy 프록시 Service를 찾아 8888:80으로 포트 포워딩합니다. 화면의 API 호출 버튼에서 version과 pod가 출력되는지 확인합니다.','시간이 남으면 split.yaml을 적용해 가중치 분할도 다시 관찰합니다. 발표에는 관리 관계 그림과 요청 흐름 그림을 각각 그려 보세요.'],expected:'도메인 설정 없이 localhost:8888에서 화면과 API 응답이 보입니다.'}),
 S('장애 미션: Service 대상이 사라졌습니다','service.yaml의 selector.app을 wrong으로 바꿔 적용한 뒤 진단합니다.',{kind:'TROUBLESHOOTING',code:'kubectl apply -f service.yaml\nkubectl -n study get svc frontend -o yaml\nkubectl -n study get pods --show-labels\nkubectl -n study get endpointslice -l kubernetes.io/service-name=frontend\n# 원인 확인 후 selector.app을 frontend로 복구하고 다시 apply',notes:['Pod는 Running인데 프록시 요청이 실패하는 상황을 만듭니다. Service가 선택할 Pod가 없어지면 EndpointSlice에 유효 대상이 없게 됩니다. 앱을 다시 빌드하거나 DNS를 수정할 문제가 아닙니다.','연습이 끝나면 파일의 selector를 반드시 복원합니다. 다음 사람이 같은 실습 폴더를 사용해도 정상 상태에서 시작할 수 있어야 합니다.'],expected:'selector를 복구하면 Endpoint가 다시 연결되고 API 응답이 회복됩니다.'}),
 S('오류 메시지에서 확인 위치를 고릅니다','증상을 추측으로 덮지 말고, 상태와 이벤트를 먼저 읽습니다.',{cards:[['Pending','describe의 Events에서 자원·스케줄링 문제 확인.'],['ImagePullBackOff','이미지 이름·태그·인증·네트워크·로컬 로드 여부 확인.'],['CrashLoopBackOff','logs와 logs --previous로 앱 종료 원인 확인.']],code:'kubectl -n study describe pod POD_NAME\nkubectl -n study logs POD_NAME\nkubectl -n study logs POD_NAME --previous\nkubectl -n study get events --sort-by=.metadata.creationTimestamp',notes:['POD_NAME은 실제 이름으로 바꿉니다. --previous는 이전에 종료된 컨테이너의 로그가 있을 때 사용합니다. 종료 기록이 없으면 에러가 날 수 있습니다.','브라우저 실패 → 프록시 규칙 → Service selector/port → Endpoint → Pod readiness/logs 순서로 범위를 좁힙니다. 404·503 등의 정확한 의미와 본문은 프록시 구현 및 앱에 따라 확인합니다.']}),
 S('Argo CD는 무엇을 배포할까요?','Git에 선언한 Kubernetes 상태와 실제 클러스터 상태를 비교하고 맞추는 도구입니다.',{kind:'CONCEPT ONLY · 15 MIN',flow:['코드 변경','CI: 이미지 생성','Git: 이미지 태그 변경','Argo CD: Sync','Kubernetes: Rollout'],notes:['CI는 테스트하고 이미지를 만드는 단계입니다. Argo CD는 기본적으로 앱 소스를 이미지로 빌드하는 도구가 아니라, Git 등에 저장된 Kubernetes 선언을 반영하는 배포 도구입니다.','Sync는 선언을 반영하는 동작입니다. Synced는 Git과 실제 설정이 일치한다는 뜻이고, 앱이 건강하다는 Health 상태와는 다릅니다. 자동 반영 여부는 설정에 따라 다릅니다. 이번 과정은 설치·저장소 연결·실제 배포 없이 그림으로만 설명합니다.']}),
 S('Argo CD · Rollout · Argo Rollouts','세 이름을 한 문장으로 연결해 봅시다.',{cards:[['Argo CD','원하는 배포 설정을 클러스터에 반영.'],['Rollout','그 변경을 실제 실행 상태에 반영하는 과정.'],['Argo Rollouts','Canary·Blue-Green 등 점진적 배포를 돕는 별도 Controller.']],notes:['Argo CD가 Deployment 이미지 태그 변경을 반영하면 Kubernetes Deployment 컨트롤러가 Rolling Update를 수행할 수 있습니다. 이 과정에 Argo Rollouts는 필수가 아닙니다.','Argo Rollouts를 사용한다면 별도 Rollout 리소스로 전략을 정의할 수 있고 Argo CD는 그 선언을 전달할 수 있습니다. 같은 Argo 이름을 가졌어도 역할은 다릅니다. 도구 설치와 설정은 후속 과정으로 남깁니다.']}),
 Q('스터디를 마치며: 이제 설명할 수 있나요?','① Deployment→ReplicaSet→Pod는 관리 관계. ② Service는 안정적 접점이며 VIP는 가상 주소. ③ Gateway API는 요청 라우팅 설정. ④ 위치 선호도와 버전별 가중치는 별개. ⑤ Rollout은 과정, 세 가지 전략은 교체·전환 방식. ⑥ Argo CD는 Git의 배포 선언을 반영하는 도구입니다.',['마무리: 포트 포워딩 터미널을 종료하고 minikube stop으로 환경을 보관합니다. 전체 환경이 더 이상 필요 없을 때만 minikube delete로 삭제하세요.'])
]);
for(const c of course) await writeFile(new URL(`chapters/${c.id}.json`,root),JSON.stringify(c,null,2));
console.log(`Wrote ${course.length} complete chapters`);

# 중간 과제 2 · 두 버전으로 트래픽 나누기

Gateway API의 연결 관계와 90:10 가중치를 직접 설계합니다.

예상 시간: 120분

## 시작 조건

1. 7~8주차 완료. Envoy Gateway 설치와 localhost 접속을 사전 확인합니다. 설치 시간은 과제 시간에서 제외합니다.
2. hw2 Namespace를 만들고 기존 eg GatewayClass를 재사용합니다. fe-study:v1 이미지를 이용해 APP_VERSION만 v1/v2로 다르게 설정해도 됩니다.

## 요구사항

1. v1·v2 Deployment와 Service를 각각 만드세요. Pod 라벨을 분리하여 두 Service의 대상이 겹치지 않게 합니다.
2. hw2에 Gateway와 HTTPRoute를 작성하세요. 도메인 조건 없이 /api가 두 Service로 분할되도록 합니다.
3. 해당 Gateway가 생성한 Envoy 프록시 Service를 찾아 localhost:18888로 포워딩하세요. 다른 Gateway의 Service를 선택하지 않게 Namespace 라벨도 확인하세요.
4. 90:10으로 100회 이상 호출해 버전별 건수를 표로 기록하세요. 50:50으로 변경해 같은 방식으로 비교하세요.
5. backendRefs의 이름 하나를 존재하지 않는 Service로 바꿔 ResolvedRefs·응답 변화를 관찰하고 복구하세요. 정확한 오류 상태 코드를 미리 정답으로 가정하지 마세요.
6. 설명 문제: Service trafficDistribution과 HTTPRoute weight의 차이를 5문장 이내로 쓰세요. DNS A 레코드와 HTTPRoute hostnames를 맞추는 가상 예시만 제출하세요.

## 시간 배분

1. 0~15분 — 라벨·리소스 이름·연결 관계 설계
2. 15~45분 — 두 버전과 Service 구성
3. 45~70분 — Gateway·HTTPRoute·포트 포워딩 연결
4. 70~95분 — 가중치 두 종류의 호출 결과 수집
5. 95~110분 — 참조 오류 관찰 및 복구
6. 110~120분 — 결과표와 개념 비교 작성

## 제출물

1. hw2 전체 YAML과 90:10·50:50 설정 파일 또는 변경 이력
2. REPORT.md: 호출 수, v1/v2 관측 수, 실제 비율, 오차 해석
3. 정상·비정상 HTTPRoute 상태 증거, 장애 복원 과정, DNS/hostnames 예시

## 평가 기준

1. 라우팅 구성 — 30점 — Namespace·parentRefs·Service 참조가 맞고 /api 응답 성공
2. 분할 관찰 — 30점 — 각 설정 100회 이상, 버전별 집계와 오차 설명
3. 장애 진단 — 20점 — ResolvedRefs 확인과 올바른 참조 복원
4. 개념 구분 — 20점 — 위치 선호와 가중치, DNS와 HTTP 라우팅 구분

## 힌트

1. Service 직접 포트 포워딩이 아니라 Envoy 프록시 Service를 포워딩해야 Gateway의 분할을 지나갑니다.
2. 프록시 Service 조회 시 gateway.envoyproxy.io/owning-gateway-namespace=hw2 라벨도 사용하세요.
3. 100회 중 정확히 10회가 v2여야 통과하는 과제가 아닙니다. 표본 오차와 실행한 HTTPRoute 설정을 함께 설명하세요.
4. Service 참조가 잘못된 가중치 대상이 있으면 일부 요청이 실패할 수도 있습니다. Route 상태와 요청 결과를 모두 수집하세요.

## 완료와 정리

1. 완료 기준: 두 가중치 설정의 관측 결과와 설명, 참조 오류의 원인·복구 증거를 제출합니다. 최종 라우팅은 정상 90:10으로 복원하고 포트 포워딩을 종료합니다.

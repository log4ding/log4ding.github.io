# 중간 과제 1 · 스스로 복구되는 FE 서비스

5주차까지 배운 내용으로 실행·복구·접속 관계를 증명합니다.

예상 시간: 120분

## 시작 조건

1. 2~5주차 완료. minikube 실행, fe-study:v1 이미지 로드 및 기본 앱 동작 확인. 설치·다운로드 대기 시간은 120분에 포함하지 않습니다.
2. 기존 study와 구분해 hw1 Namespace에서 진행합니다. server.mjs와 Dockerfile은 재사용하되 리소스 YAML은 직접 작성합니다.

## 요구사항

1. frontend Deployment를 2개 Pod로 실행하고 APP_VERSION을 hw1으로 설정하세요. 앱의 포트는 8080입니다.
2. frontend Service는 ClusterIP, port 80 → targetPort 8080으로 작성하세요. selector와 Pod 라벨의 연결을 설명하세요.
3. Service 포트 포워딩을 localhost:18080으로 열어 화면과 /api의 결과를 확인하세요.
4. Pod 하나를 삭제하기 전후 이름·개수·READY를 기록하고, ReplicaSet이 한 일을 설명하세요.
5. Service selector를 잠깐 잘못 바꿔 Endpoint 변화를 기록한 뒤 복구하세요. 내부 VIP와 외부 VIP를 구분하는 문장, 가상 도메인의 A 레코드 한 줄을 작성하세요. 실제 DNS 변경은 하지 않습니다.

## 시간 배분

1. 0~15분 — 목표 구조와 라벨·포트 설계
2. 15~50분 — Namespace·Deployment·Service YAML 작성
3. 50~75분 — 화면/API 확인, Pod 삭제 및 복구 관찰
4. 75~100분 — Selector 오류 진단과 복원
5. 100~120분 — 증거 정리와 5문장 설명

## 제출물

1. namespace.yaml, deployment.yaml, service.yaml
2. REPORT.md: 실행 명령, 정상 응답, 삭제 전후 Pod 목록, Endpoint 오류·복구 증거
3. 관리 관계·요청 흐름 그림 각각 1개 및 가상 DNS 매핑 1줄

## 평가 기준

1. 선언과 접속 — 30점 — Pod 2개 Ready, 앱 버전 hw1 및 /api 응답 확인
2. 복구 관찰 — 25점 — 삭제 전후 다른 Pod가 생성됨을 증거로 설명
3. 네트워크 진단 — 25점 — Selector 오류와 Endpoint 변화의 인과관계 및 복구
4. 설명·재현성 — 20점 — 라벨·포트·VIP 설명과 제출 파일로 재현 가능

## 힌트

1. Service 이름을 Deployment와 같게 정했다고 자동 연결되지는 않습니다. get pods --show-labels와 Service selector를 나란히 보세요.
2. port-forward가 연결했던 Pod가 사라지면 포워딩도 끊길 수 있습니다. Pod 복구 확인과 터널 재연결을 별개로 확인하세요.
3. 외부 A 레코드의 대상에 10.96.x.x 같은 ClusterIP를 넣지 않습니다. 문서용 외부 VIP 203.0.113.10을 써도 됩니다.

## 완료와 정리

1. 완료 기준: YAML로 정상 상태 재현, Pod 복구 확인, 의도한 장애 복원, 세 종류의 제출물 준비. 과제 종료 후 포트 포워딩을 종료하고 hw1 리소스는 리뷰까지 보관합니다.

# log4ding · Learning Notes

[Kubernetes for Frontend](./k8s/)

강의 파일은 `k8s/chapters/*.json` 및 `k8s/advanced/*.json`에서 관리합니다. `node scripts/build.mjs`를 실행하면 폴더를 읽어 강의 목록을 생성합니다. `node scripts/serve.mjs`로 로컬 미리보기를 실행합니다.

기본 10주 + 심화 6챕터·116개 슬라이드에 개념, 상세 해설, 실습 명령, 예상 결과, 확인 문제와 공식 문서 링크를 포함합니다. 발표 모드, 전체 읽기, 키보드 이동, 코드 복사, 로컬 학습 완료 표시를 지원합니다. 9주차에는 Rolling Update·Blue-Green·Canary의 단계별 그림이 있습니다.

GitHub Pages는 `.github/workflows/pages.yml`을 사용하며 저장소 Settings → Pages의 Source를 GitHub Actions로 설정합니다. 이미 브랜치 기반 Pages를 사용한다면 루트의 `index.html`과 미리 생성된 `catalog.json`으로도 열립니다.

내용 수정은 `k8s/chapters/*.json` 및 `k8s/advanced/*.json`에서 하고 `node scripts/build.mjs`로 목록을 갱신하세요. 새 JSON 파일도 자동 검색합니다.

실습 파일은 `k8s/labs`에 있습니다. 명령은 이 폴더에서 실행하는 기준입니다. 도메인·VIP는 설명만 하며 외부 도메인이나 hosts 수정이 필요 없습니다. Argo CD·Argo Rollouts는 설치 실습 없이 개념으로 설명합니다. Ingress는 YAML 읽기 중심이고 실제 프록시 설치는 Gateway API로 통일했습니다.

검증 범위: 정적 자료 구조, 브라우저 탐색 및 샘플 HTTP 앱 응답을 확인했습니다. 이 제작 환경에서 Kubernetes 클러스터를 실제로 설치하거나 전체 클러스터 실습을 실행한 것은 아닙니다. 수업 전 공식 호환성 표와 조직의 설치·네트워크 정책을 확인하세요.

중간 과제는 5주차·8주차 말미에 각 120분, 파이널은 10주차 말미에 240분 권장으로 제공됩니다. 각 과제는 요구사항·시간표·제출물·100점 평가표·힌트와 Markdown 다운로드를 포함합니다. 도메인 예시는 DNS A/CNAME 표와 Ingress/Gateway HTTPS 설정이며 설명 전용입니다. 본문 해설은 기본으로 펼쳐집니다.

심화 과정: Probe → preStop·정상 종료 → /·/api 라우팅과 Rewrite → 접근 로그와 헤더 → 배포 관찰 → Zone·Region 장애 전환. 멀티 Region 그림은 각 Region의 독립 Ingress·Service·Deployment와 글로벌 라우팅을 구분합니다. 애니메이션의 시간·비율은 개념 설명이며 무손실 보장이 아닙니다. 재생·단계 이동·장애·GET 재시도를 지원하고 동작 줄이기 설정에서는 정적 단계로 표시합니다.

8주차 위치 선호 애니메이션은 모든 Pod가 정상인 상태에서 설정 전후의 교차 Zone 이동을 비교합니다. A06은 글로벌 LB 아래 두 독립 클러스터를 보여주며, 두 계층을 함께 쓰는 별도 구성도도 제공합니다. 정상 상태의 통신 최적화와 Region 전체 장애 전환을 구별합니다.

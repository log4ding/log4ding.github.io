# log4ding · Learning Notes

[Kubernetes for Frontend](./k8s/)

강의 파일은 `k8s/chapters/*.json`에서 관리합니다. `node scripts/build.mjs`를 실행하면 폴더를 읽어 강의 목록을 생성합니다. `node scripts/serve.mjs`로 로컬 미리보기를 실행합니다.

10주·66개 슬라이드에 개념, 상세 해설, 실습 명령, 예상 결과, 확인 문제와 공식 문서 링크를 포함합니다. 발표 모드, 전체 읽기, 키보드 이동, 코드 복사, 로컬 학습 완료 표시를 지원합니다. 9주차에는 Rolling Update·Blue-Green·Canary의 단계별 그림이 있습니다.

GitHub Pages는 `.github/workflows/pages.yml`을 사용하며 저장소 Settings → Pages의 Source를 GitHub Actions로 설정합니다. 이미 브랜치 기반 Pages를 사용한다면 루트의 `index.html`과 미리 생성된 `catalog.json`으로도 열립니다.

내용 수정은 `k8s/chapters/*.json`에서 하고 `node scripts/build.mjs`로 목록을 갱신하세요. 새 JSON 파일도 자동 검색합니다. `scripts/write-course.mjs`는 최초 자료 작성용 스크립트이므로 다시 실행하면 기존 JSON과 실습 파일이 원본 초안으로 덮어써집니다.

실습 파일은 `k8s/labs`에 있습니다. 명령은 이 폴더에서 실행하는 기준입니다. 도메인·VIP는 설명만 하며 외부 도메인이나 hosts 수정이 필요 없습니다. Argo CD·Argo Rollouts는 설치 실습 없이 개념으로 설명합니다. Ingress는 YAML 읽기 중심이고 실제 프록시 설치는 Gateway API로 통일했습니다.

검증 범위: 정적 자료 구조, 브라우저 탐색 및 샘플 HTTP 앱 응답을 확인했습니다. 이 제작 환경에서 Kubernetes 클러스터를 실제로 설치하거나 전체 클러스터 실습을 실행한 것은 아닙니다. 수업 전 공식 호환성 표와 조직의 설치·네트워크 정책을 확인하세요.

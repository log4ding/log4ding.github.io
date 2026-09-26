# 심화 실습 파일

기본 10주와 별도 advanced-study Namespace를 사용합니다.

1. 이 폴더에서 이미지 빌드 및 minikube image load.
2. apps.yaml 적용 (A01).
3. shutdown-patch.yaml을 api Deployment에 patch (A02).
4. 기본 과정에서 설치한 Envoy Gateway와 eg GatewayClass를 재사용하고 gateway.yaml, route.yaml 적용 (A03).
5. access-log.yaml 적용 후 logging-patch.yaml을 advanced-gateway에 merge patch (A04).
6. Gateway 프록시 Service를 18888:80 포트 포워딩 후 node observe.mjs (A05).

전체 명령·예상 결과·실패 해설은 웹의 심화 챕터에서 확인합니다. apps.yaml을 다시 적용하면 버전 등이 v1 선언으로 돌아갈 수 있습니다. gateway.yaml을 다시 apply하면 kubectl patch로 추가한 로그 참조가 유지될 수 있으므로 최종 실제 YAML을 확인하세요.

실습 종료: 포트 포워딩 종료. 더 이상 필요 없을 때만 kubectl delete namespace advanced-study. 공유 eg GatewayClass나 Envoy Gateway 설치는 삭제하지 않습니다.

A06은 클라우드 리소스를 만드는 실습이 아닌 설명용 애니메이션입니다.

제작 환경 검증: 샘플 HTTP 서버의 준비 상태, 헤더 처리, 경로 응답, graceful shutdown을 Node에서 확인합니다. 실제 Kubernetes·Envoy Gateway 전체 실행은 별도 사전 검증이 필요합니다.

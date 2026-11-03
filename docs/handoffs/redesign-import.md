# 설경민 데모 앱 통합

- 화면 소스: https://github.com/k0ng-min/verimod_demo/tree/e6aea87073ee4963a13efc732c44efb5d150e2f3
- 대상: https://github.com/jujinho03/verimod
- `src/`, `public/`, `server/`, 수집용 `shared/`, 테스트와 실행 설정을 가져왔습니다. 화면과 에셋은 원본 그대로입니다.
- Vite/TypeScript/테스트의 `upstream/` 참조만 이 저장소의 `frontend/`, `backend/`, `shared/protocol/`로 연결했습니다.
- 루트 `npm run dev:all`은 R01(가중치 준비 시) → backend → 수집/세션 서비스 → 디자인 앱을 실행합니다. 별도 clone은 필요 없습니다.

## 로컬 설정

루트 `.env.local`에 서버 전용 설정을 넣습니다. 실제 키와 가중치는 Git에 포함하지 않습니다.

```dotenv
YOUTUBE_API_KEY=<server-only>
GEMINI_API_KEY=<server-only>
VERIMOD_R01_PACKAGE=C:/path/to/VeriMod_R01_Model_Handoff
VERIMOD_PYTHON=C:/path/to/ai/.venv/Scripts/python.exe
```

모델 인계 폴더의 `model/selected_model`과 `tokenizer_hf_cache`를 사용합니다. Linux/macOS는 `ai/.venv/bin/python`을 기본으로 사용합니다. 공개 체인 프로필은 `.env.development`/`.env.production`에 있으며 비밀키는 포함하지 않습니다.

## 실행과 확인

```sh
npm ci
npm ci --prefix backend
npm run build
npm test
npm run dev:all
```

http://localhost:5190 에서 링크 입력 → 콘텐츠 확인 → 수집 범위 → 단어/관련 주제 → 댓글 선택 → 판정 전 확인 → 판정 → 결과 → 영수증/공유로 이어집니다. 데모 둘러보기는 명시적인 합성 체험 경로이며 실제 발급과 구분됩니다. 새 실제 영수증은 PENDING_ANCHOR이며, 기존 W4 공개 증거 검증은 별도입니다.

기존 backend 및 protocol/chain 코드는 보존했습니다. 루트 디자인 앱에 대한 CI job을 추가하여 기존 frontend/backend/contracts 검사와 함께 실행합니다.

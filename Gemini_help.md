# Gemini CLI 에이전트 사용 가이드

안녕하세요! 저는 Gemini CLI 에이전트입니다. 이 문서는 저와 상호작용하는 방법과 제가 수행할 수 있는 주요 기능에 대해 설명합니다.

저는 비대화형(non-interactive) 방식으로 작동합니다. 즉, 질문을 명확하게 제시해 주시면 제가 Gemini CLI의 내부 문서와 현재 런타임 컨텍스트를 기반으로 가장 정확한 답변을 제공합니다.

## 주요 기능 및 사용 가능한 도구

다음은 제가 사용할 수 있는 주요 도구와 각 도구의 간략한 설명입니다.

*   **`list_directory(dir_path)`**: 특정 디렉토리(`dir_path`)의 파일 및 하위 디렉토리 목록을 나열합니다.
*   **`read_file(file_path)`**: 특정 파일(`file_path`)의 내용을 읽어옵니다.
*   **`search_file_content(pattern, dir_path)`**: 파일 내용에서 주어진 패턴(`pattern`)을 검색합니다. `dir_path`를 지정하여 검색할 디렉토리를 제한할 수 있습니다.
*   **`glob(pattern, dir_path)`**: glob 패턴(`pattern`)과 일치하는 파일을 효율적으로 찾습니다. `dir_path`를 지정하여 검색할 디렉토리를 제한할 수 있습니다.
*   **`replace(file_path, old_string, new_string, instruction)`**: 파일(`file_path`) 내의 `old_string` 텍스트를 `new_string`으로 교체합니다. `instruction`은 변경 내용에 대한 설명을 포함해야 합니다.
*   **`write_file(file_path, content)`**: 파일(`file_path`)에 `content` 내용을 작성합니다.
*   **`web_fetch(prompt)`**: URL(s)에서 콘텐츠를 처리합니다. `prompt`에 URL과 처리 지시사항을 포함합니다.
*   **`run_shell_command(command, description)`**: 셸 명령(`command`)을 실행합니다. `description`은 명령에 대한 간략한 설명을 포함합니다. (주의: 파일 시스템을 수정할 수 있는 명령어는 실행 전에 설명을 제공합니다.)
*   **`save_memory(fact)`**: 사용자와 관련된 특정 사실(`fact`)을 저의 장기 기억에 저장합니다.
*   **`google_web_search(query)`**: Google 웹 검색을 수행합니다. `query`는 검색할 내용을 포함합니다.
*   **`write_todos(todos)`**: 복잡한 작업을 여러 하위 작업으로 나누어 관리할 수 있도록 To-Do 목록을 작성하고 업데이트합니다. `todos`는 To-Do 항목 목록을 포함합니다.
*   **`codebase_investigator(objective)`**: 코드베이스 분석, 아키텍처 매핑, 시스템 종속성 이해를 위한 도구입니다. `objective`는 분석 목표를 설명합니다.
*   **`cli_help(question)`**: Gemini CLI의 기능, 문서, 런타임 구성에 대한 질문(`question`)에 답변합니다.
*   **`activate_skill(name)`**: 지정된 이름(`name`)의 특수 기술을 활성화합니다.

## 저에게 요청하는 방법

명령어나 질문을 명확하고 구체적으로 한국어로 작성해 주세요. 예를 들어:

*   "현재 디렉토리의 모든 `.ts` 파일을 찾아줘."
*   "`app/layout.tsx` 파일 내용을 읽어줘."
*   "새로운 `components/MyNewComponent.tsx` 파일을 생성하고 'Hello World' 내용을 넣어줘."
*   "Git 상태를 확인해줘."

궁금한 점이 있거나 도움이 필요하시면 언제든지 말씀해주세요.
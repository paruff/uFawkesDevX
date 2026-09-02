# Changelog

## 1.0.0 (2026-09-02)


### Added

* Add Developer Control Plane Docker Compose stack ([adb59a2](https://github.com/paruff/uFawkesDevX/commit/adb59a238bb81e15f78950c12cdd12b67cb8d811))
* add GitOps lifecycle gates to uFawkesDevX ([d6f5b0e](https://github.com/paruff/uFawkesDevX/commit/d6f5b0ee9085998997a35aecc618091e85be303a))
* add GitOps lifecycle gates to uFawkesDevX ([2bd3106](https://github.com/paruff/uFawkesDevX/commit/2bd3106fbcc8663ca10a8dd2f3e65bb9172e8d57))
* Add implementation plan and specification for uFawkesDevX v0.2 ([4352dd5](https://github.com/paruff/uFawkesDevX/commit/4352dd585a294f008eea12e5d47c8696cc672a64))
* **ci:** add opencode GitHub Action, ported from fawkes ([5264837](https://github.com/paruff/uFawkesDevX/commit/5264837c62eecfd858f96d60a39ade61fe360398))
* **ci:** add opencode GitHub Action, ported from fawkes ([eb759a1](https://github.com/paruff/uFawkesDevX/commit/eb759a13cb2cf390cf638389e848a9ffd326087c))
* **ci:** add release-please automated release proposals ([2164bdd](https://github.com/paruff/uFawkesDevX/commit/2164bdd5de21d198b3db1006f7a5326ff8705b10))
* **ci:** add release-please automated release proposals ([45b8e02](https://github.com/paruff/uFawkesDevX/commit/45b8e02491a5d3effb018bb313335f96a28ea531))
* **devx:** add .woodpecker.yml self-CI (DX-007) ([fcd1e61](https://github.com/paruff/uFawkesDevX/commit/fcd1e6120e72549ced005a16eb0dde9e8d9ab8fa))
* **devx:** add CI pipeline and comprehensive test suite ([94eb0f5](https://github.com/paruff/uFawkesDevX/commit/94eb0f53b1b80bfb1b429937cfd5abed0ee5c99f))
* **devx:** add CI pipeline and comprehensive test suite ([edb1495](https://github.com/paruff/uFawkesDevX/commit/edb149565b45be06c092a1fa9866f10e9937a011))
* **devx:** add Coder devcontainer workspace template (DX-004) ([892faa2](https://github.com/paruff/uFawkesDevX/commit/892faa2f6ba85903952b29703c906cb89f115c47))
* **devx:** add Coder devcontainer workspace template (DX-004) ([996081d](https://github.com/paruff/uFawkesDevX/commit/996081d8be3ff2917eeee8f7dd4b38b403d0188a)), closes [#28](https://github.com/paruff/uFawkesDevX/issues/28)
* **devx:** add Cookiecutter golden path templates (DX-006) ([9186984](https://github.com/paruff/uFawkesDevX/commit/9186984736503f0b545590e387d4397d9b6f7d72))
* **devx:** add Cookiecutter golden path templates (DX-006) ([3638592](https://github.com/paruff/uFawkesDevX/commit/3638592a9ac009ba889b2e79ab189acf85ecef03)), closes [#30](https://github.com/paruff/uFawkesDevX/issues/30)
* **devx:** migrate compose.yaml to v0.2 topology (DX-002) ([0fc7363](https://github.com/paruff/uFawkesDevX/commit/0fc73630353de5ae9693eb7b6e17007353e39480))
* **devx:** migrate compose.yaml to v0.2 topology (DX-002) ([439e45c](https://github.com/paruff/uFawkesDevX/commit/439e45cc28a6e2d84613e1f7580087547df99e37)), closes [#26](https://github.com/paruff/uFawkesDevX/issues/26)
* **devx:** reconcile Backstage catalog with 5 uFawkes planes (DX-005) ([6aeca9c](https://github.com/paruff/uFawkesDevX/commit/6aeca9ce6f568fd433fd9d475f3a2b131068db52))
* **devx:** reconcile Backstage catalog with 5 uFawkes planes (DX-005) ([310eef6](https://github.com/paruff/uFawkesDevX/commit/310eef6187e9101d685a7478e5ed8d13109b7f6d)), closes [#29](https://github.com/paruff/uFawkesDevX/issues/29)
* **score-service:** generate compose via score-compose, trigger pipeline webhook (DX-003) ([51f69d6](https://github.com/paruff/uFawkesDevX/commit/51f69d6b3890d661b675144540e7b9ba5076a0df)), closes [#27](https://github.com/paruff/uFawkesDevX/issues/27)


### Fixed

* **ci:** add .env setup step before Docker Compose in test jobs ([4800579](https://github.com/paruff/uFawkesDevX/commit/48005791a03360abf84169c614fa60b95fc284d7))
* **ci:** bump uFawkesPipe to v1.2.0, disable PR size check ([7498ffd](https://github.com/paruff/uFawkesDevX/commit/7498ffd2f712174ab1a919c630bc1ab1f05841bf))
* **ci:** exclude templates/ from Trivy fs scan ([17ca873](https://github.com/paruff/uFawkesDevX/commit/17ca873ea38ef3417f19fbcb5cbf72609d5cb2e3))
* **ci:** merge main — align with uFawkesPipe, deterministic pre-commit ([e0fb33a](https://github.com/paruff/uFawkesDevX/commit/e0fb33a8e09061417e32deb35564d8792628cfb1))
* **ci:** remove commit-msg hook, add live model resolver ([51349f4](https://github.com/paruff/uFawkesDevX/commit/51349f46c44c9c513afd429219fb6015d424e821))
* **ci:** remove prettier hook, fix pre-commit formatting ([25e082e](https://github.com/paruff/uFawkesDevX/commit/25e082e67cc1cc22c2f61ba889d658bd69fa9109))
* **ci:** remove Terraform/TFLint steps re-added by mistake ([ce5ec41](https://github.com/paruff/uFawkesDevX/commit/ce5ec412be36c61a7d19e174f03a06db465066cb))
* **ci:** resolve CI Pipeline startup_failure and pre-commit failures ([487bc86](https://github.com/paruff/uFawkesDevX/commit/487bc86dd3ffb36c5edcce5cae5031aef9487f76))
* **ci:** resolve merge conflict — accept deletion of reusable-lint.yml ([28aac62](https://github.com/paruff/uFawkesDevX/commit/28aac6232403b86a5d4abf2d67524d41f6cd0b75))
* **ci:** resolve merge conflicts — use uFawkesPipe reusable workflows ([7870b06](https://github.com/paruff/uFawkesDevX/commit/7870b06ece43db35c86f31da81b8856b0135ff25))
* **ci:** resolve merge conflicts with main — align with uFawkesPipe pattern ([0269556](https://github.com/paruff/uFawkesDevX/commit/0269556a4187120e43041124ef7035511cddb695))
* **devx:** add CODER_ACCESS_URL localhost warning, rename compose test file (DX-002) ([40fcbe1](https://github.com/paruff/uFawkesDevX/commit/40fcbe1eaa6c995df1a817c34d95c9393f8cd9df))
* **devx:** warn on localhost CODER_ACCESS_URL, rename compose test ([bd09898](https://github.com/paruff/uFawkesDevX/commit/bd09898dc0b44872d9a253a7d53d96896fe28491))
* Resolve pre-commit hook failures ([131c468](https://github.com/paruff/uFawkesDevX/commit/131c468976acf99190d0b3ec5ae9a2401f233ec5))
* **score-service:** generate compose via score-compose, trigger pipeline webhook (DX-003) ([ff3e1ef](https://github.com/paruff/uFawkesDevX/commit/ff3e1ef7684d2f5fd97f50b449ba5549b257a55d))
* **score-service:** validate name in generateComposeFromSpec (CodeQL) ([9c228c0](https://github.com/paruff/uFawkesDevX/commit/9c228c0b19fc703b0613df9b1584508a8304bb49))
* **security:** use placeholder value for POSTGRES_PASSWORD in .env.example ([dcd2138](https://github.com/paruff/uFawkesDevX/commit/dcd2138ea28dcd8a83f802a93bf7a47481cd6aed))
* **test:** allowlist anomalyco/ for opencode.yml's vendored action ([140101d](https://github.com/paruff/uFawkesDevX/commit/140101dc6b03360baae8fbedd49cec6d15c00efd))
* **test:** allowlist googleapis/ for release-please.yml's vendored action ([38c44d1](https://github.com/paruff/uFawkesDevX/commit/38c44d12af119e31d8c45ab6c43596ed9ccf0dcc))
* **test:** cast yaml.safe_load returns to str for mypy ([8920be5](https://github.com/paruff/uFawkesDevX/commit/8920be5db590ae9baa9fc65747f14cf3727987f3))


### Docs

* add cross-repo stack links ([2a0797f](https://github.com/paruff/uFawkesDevX/commit/2a0797f05d997061f53a0dbe8a48454453d83528))
* **ci:** add CI fix report and agent logs for PR [#21](https://github.com/paruff/uFawkesDevX/issues/21) ([d1cff68](https://github.com/paruff/uFawkesDevX/commit/d1cff687407e52c42ab73a270bdf980eb727a71e))
* **ci:** update CI diagnosis and fix report for PR [#20](https://github.com/paruff/uFawkesDevX/issues/20) ([7138ff9](https://github.com/paruff/uFawkesDevX/commit/7138ff98011ab0e9768b375206657e161cb6fe62))
* **design:** add design documentation for uFawkesDevX v0.2 ([1ea0331](https://github.com/paruff/uFawkesDevX/commit/1ea03317bd953d9194432b3abc1f46cfa02a8e3c))
* **design:** add design documentation for uFawkesDevX v0.2 including component map, repository structure, and service configurations. ([1ea0331](https://github.com/paruff/uFawkesDevX/commit/1ea03317bd953d9194432b3abc1f46cfa02a8e3c))
* document never-swallow-exceptions principle in scripts rules ([4143c63](https://github.com/paruff/uFawkesDevX/commit/4143c632b553983053239b0ffbd1fd8e9198b4fc))
* **plan:** add implementation plan for uFawkesDevX v0.2 ([98cfdd5](https://github.com/paruff/uFawkesDevX/commit/98cfdd545b4ed10d35bc70d051a2bbd204aaa186))
* rewrite README.md and add docs/quickstart.md (DX-008) ([6dc64a7](https://github.com/paruff/uFawkesDevX/commit/6dc64a7ea819e3446bac1bcfd6ef0c1c475c56c3))
* rewrite README.md and add docs/quickstart.md (DX-008) ([750a81e](https://github.com/paruff/uFawkesDevX/commit/750a81eab2551fd39bc8dc248c9b72b8ab9f4908)), closes [#31](https://github.com/paruff/uFawkesDevX/issues/31)
* **spec:** add specification for uFawkesDevX v0.2 ([d5d2aa9](https://github.com/paruff/uFawkesDevX/commit/d5d2aa90c976b704fd2e2ceecdefbfc38a850946))


### Changed

* **ci:** migrate reusable workflows to uFawkesPipe@v1.0.0 ([d984cb3](https://github.com/paruff/uFawkesDevX/commit/d984cb323d283e5defa48b3f6025c329de1d29ed))
* **ci:** migrate reusable workflows to uFawkesPipe@v1.0.0 ([dee568a](https://github.com/paruff/uFawkesDevX/commit/dee568a5cecddd89880ed84cc26a1acaddd71200))


### Chores

* **ci:** add .woodpecker.yml self-CI (DX-007) ([f21cd89](https://github.com/paruff/uFawkesDevX/commit/f21cd89963af228278728aea4aeafde869f1e3bd)), closes [#37](https://github.com/paruff/uFawkesDevX/issues/37)
* clean up git workspace ignores ([7350654](https://github.com/paruff/uFawkesDevX/commit/7350654979fb4a7e9f77fee37d9ff0e25369e657))
* **deps:** bump actions/cache from 5 to 6 ([3dcdee4](https://github.com/paruff/uFawkesDevX/commit/3dcdee4fa1ae713c598ab33cdf88973ae87f30f5))
* **deps:** bump actions/cache from 5 to 6 ([af4c8a1](https://github.com/paruff/uFawkesDevX/commit/af4c8a1f72d923810fec4195bec6726ad98afc2b))
* **deps:** bump actions/checkout from 6 to 7 ([669f3cc](https://github.com/paruff/uFawkesDevX/commit/669f3cc384b7eba329f63af2515f1608531ebf9a))
* **deps:** bump actions/checkout from 6 to 7 ([140c3dc](https://github.com/paruff/uFawkesDevX/commit/140c3dc8b8510744b7692fb6d01256234f5ee811))
* **deps:** bump actions/dependency-review-action from 4 to 5 ([b1fd481](https://github.com/paruff/uFawkesDevX/commit/b1fd48176498fb98fa2b4aeff70aa4b5aeb74c02))
* **deps:** bump actions/dependency-review-action from 4 to 5 ([4cb3728](https://github.com/paruff/uFawkesDevX/commit/4cb37286f73fff07de6ceb25790c2bda61473842))
* **deps:** bump actions/setup-go from 6 to 7 ([f87859c](https://github.com/paruff/uFawkesDevX/commit/f87859c64150322819ab4bd27faf6cc52541d989))
* **deps:** bump actions/setup-node from 6 to 7 ([9bb838b](https://github.com/paruff/uFawkesDevX/commit/9bb838b7161e2288daf521eb1fa2e76dfe3e4aa4))
* **deps:** bump actions/setup-python from 6 to 7 ([0519aff](https://github.com/paruff/uFawkesDevX/commit/0519aff8295b78cc67e597ee369e3dd669fe03ed))
* **deps:** bump actions/upload-artifact from 4 to 7 ([c99caa9](https://github.com/paruff/uFawkesDevX/commit/c99caa9cd52cd477453d9b4202f70430e55030a7))
* **deps:** bump actions/upload-artifact from 4 to 7 ([1874f64](https://github.com/paruff/uFawkesDevX/commit/1874f648fa9719609e0dc6f7f7dcbe1609a16343))
* **deps:** bump anomalyco/opencode/github from 1.18.18 to 1.18.23 ([ecb9f4e](https://github.com/paruff/uFawkesDevX/commit/ecb9f4ea7f9a65bfcde49c14c1881a4b4f27363f))
* **deps:** bump flask ([875dcbb](https://github.com/paruff/uFawkesDevX/commit/875dcbb54ecab5a0f9b5c690f09266ad7591d94b))
* **deps:** bump flask from 3.0.3 to 3.1.3 in /templates/python-flask-app/{{cookiecutter.project_slug}} in the pip group across 1 directory ([cf7f693](https://github.com/paruff/uFawkesDevX/commit/cf7f69319d79387807081d4de2e2d0ee1da622de))
* **deps:** bump uFawkesPipe from [@v1](https://github.com/v1).0.0 to [@v1](https://github.com/v1).1.0 ([691121d](https://github.com/paruff/uFawkesDevX/commit/691121dbd36173c6de1fb01636acfbcca684d5bc))
* **gitops:** add .secrets.baseline for detect-secrets ([3c5a6cc](https://github.com/paruff/uFawkesDevX/commit/3c5a6cc91243533cb330f5f8302c933c06e68438))
* **gitops:** initialize GitOps standards ([b161b19](https://github.com/paruff/uFawkesDevX/commit/b161b19c79f26bde561a44aedf08e501f6d5a776))

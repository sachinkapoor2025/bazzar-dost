.PHONY: build-ApiFunction

ESBUILD = npx esbuild --bundle --platform=node --target=es2022 --minify \
	--external:@aws-sdk/client-dynamodb \
	--external:@aws-sdk/lib-dynamodb \
	--external:@aws-sdk/client-s3

build-ApiFunction:
	$(ESBUILD) apps/api/src/index.ts --outfile=$(ARTIFACTS_DIR)/index.js

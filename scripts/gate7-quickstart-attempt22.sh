#!/bin/bash
# Attempt 22 quickstart scenario runs (logs per scenario).
cd /root/specstride-152 || exit 2
E=.specstride/features/152-commit-backpressure/evidence
stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

run() { # $1 log tag, $2 dir, $3 test file, $4 name pattern (optional)
  d=$1; f=$2; p=$3; tag=$4
  { stamp; echo "scenario $tag: dir=$d file=$f pattern=${p:-<none>}"; cd "$d"
    if [ -n "$p" ]; then node ../../tests/isolate.ts node --test --test-name-pattern "$p" "test/$f"; else node ../../tests/isolate.ts node --test "test/$f"; fi
    echo "EXIT=$?"; cd - >/dev/null; stamp; } > "$E/gate7-quickstart-$tag.log" 2>&1
}

run packages/core ct-152-1-152.test.ts "" q01a-scenario1
run packages/cli engine/commit-gate-retry.test.ts "CT-152-2" q01b-scenario1
run packages/cli engine/commit-gate-retry.test.ts "CT-152-4" q02a-scenario2
run packages/core ct-152-10-152.test.ts "" q02b-scenario2
run packages/core ct-152-13-152.test.ts "" q02c-scenario2
run packages/cli engine/commit-gate-halt.test.ts "T090|T092" q03-scenario3
run packages/cli engine/commit-gate-halt.test.ts "T091" q04-scenario4
run packages/cli engine/commit-gate-retry.test.ts "T163" q05a-scenario5
run packages/core ct-152-11-152.test.ts "" q05b-scenario5
run packages/cli engine/commit-gate-retry.test.ts "CT-152-12 " q06a-scenario6
run packages/core ct-152-19-152.test.ts "" q06b-scenario6
run packages/cli engine/commit-gate-crash.test.ts "" q07a-scenario7
run packages/core ct-152-15-152.test.ts "" q07b-scenario7
run packages/cli engine/commit-gate-crash.test.ts "T109" q08a-scenario8
run packages/core ct-152-14-152.test.ts "" q08b-scenario8
run packages/core ct-152-17-152.test.ts "" q11-scenario11
run packages/core ct-152-18-152.test.ts "" q12-scenario12
run packages/core ct-152-16-152.test.ts "" q12b-scenario12
echo ALL-DONE
